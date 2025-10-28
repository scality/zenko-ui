import { S3 } from 'aws-sdk';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useIAMClient } from '../react/IAMProvider';
import { useManagementClient } from '../react/ManagementProvider';
import { useInstanceId } from '../react/next-architecture/ui/AuthProvider';
import { useS3Client } from '../react/next-architecture/ui/S3ClientProvider';
import { ApiError } from '../types/actions';
import { TagSetItem } from '../types/s3';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { MULTIPART_UPLOAD } from './S3Client';
import { EndpointV1 } from './managementClient/api';
import { useShellHooks } from '@scality/module-federation';
import { getPolicyInfoQuery } from '../react/queries';
import { defaultActions, immutableActions } from '../react/ISV/utils/ISVPolicy';
import { useDeployedMetalk8sInstances } from '../react/next-architecture/ui/ConfigProvider';

export const useWaitForRunningConfigurationVersionToBeUpdated = () => {
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const client = notFalsyTypeGuard(managementClient);
  const runningConfigurationVersionMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      client.setToken(await getToken());
      return (
        (await client.getLatestInstanceStatus(instanceId)).state
          ?.runningConfigurationVersion || 0
      );
    },
  });
  const versionRef = useRef(0);
  const [status, setStatus] = useState<
    'idle' | 'refTaken' | 'waiting' | 'success' | 'error'
  >('idle');
  const setReferenceVersion = ({ onRefTaken }: { onRefTaken?: () => void }) => {
    setStatus('waiting');
    runningConfigurationVersionMutation.mutate(instanceId, {
      onSuccess: (version) => {
        versionRef.current = version;
        setStatus('refTaken');
        if (onRefTaken) {
          onRefTaken();
        }
      },
      onError: () => {
        setStatus('error');
      },
    });
  };

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
  const waitForRunningConfigurationVersionToBeUpdated = () => {
    setStatus('waiting');
    runningConfigurationVersionMutation.mutate(instanceId, {
      onSuccess: (version) => {
        if (version > versionRef.current) {
          setStatus('success');
        } else {
          setTimeoutId(
            setTimeout(waitForRunningConfigurationVersionToBeUpdated, 500),
          );
        }
      },
      onError: () => {
        setStatus('error');
      },
    });
  };
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);
  return {
    waitForRunningConfigurationVersionToBeUpdated,
    setReferenceVersion,
    status,
  };
};
const useCreateEndpointMutation = () => {
  const managementClient = useManagementClient();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();

  return useMutation<
    EndpointV1,
    ApiError,
    {
      hostname: string;
      locationName: string;
      instanceId: string;
    }
  >({
    mutationFn: async ({ hostname, locationName, instanceId }) => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      const params = {
        uuid: instanceId,
        endpoint: {
          hostname,
          locationName,
        },
      };
      return notFalsyTypeGuard(client).createConfigurationOverlayEndpoint(
        params.endpoint,
        params.uuid,
      );
    },
  });
};

const useCreateAccountMutation = () => {
  const managementClient = useManagementClient();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({
      user,
      instanceId,
    }: {
      user: { userName: string; email: string };
      instanceId: string;
    }) => {
      user.email = user.email.replace(/ /g, '-');
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      const params = {
        uuid: instanceId,
        user,
      };
      return notFalsyTypeGuard(client)
        .createConfigurationOverlayUser(params.user, params.uuid)
        .then((res) => {
          const key = 'createAccount';
          const responseWithKey = {
            ...res,
            key,
          };
          return responseWithKey;
        })
        .catch(async (error: Response) => {
          if (error.status === 409) {
            throw {
              message: 'An account with the same name or email already exists',
            };
          }
          throw {
            message: 'An error occurred while creating the account',
          };
        });
    },
  });
};

const useCreateIAMUserMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({ userName }: { userName: string }) =>
      IAMClient.createUser(userName),
  });
};

const useCreatePolicyMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({
      policyName,
      policyDocument,
    }: {
      policyName: string;
      policyDocument: string;
    }) => IAMClient.createPolicy(policyName, policyDocument),
  });
};

const useCreateOrAddBucketToPolicyMutation = () => {
  const IAMClient = useIAMClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      policyName,
      bucketsName,
      isImmutable,
      policyArn,
      getPolicy,
    }: {
      policyName: string;
      bucketsName: string[];
      isImmutable: boolean;
      policyArn: string;
      getPolicy: (bucketsName: string[], isImmutable: boolean) => string;
    }) => {
      const { Policy: policyData } = await queryClient
        .fetchQuery(getPolicyInfoQuery(policyArn, IAMClient))
        .catch((error) => {
          const notFound = error.toString().includes('NoSuchEntity');
          if (notFound) {
            return { Policy: null };
          } else throw error;
        });
      const newPolicyDocument = getPolicy(bucketsName, isImmutable);

      if (!policyData) {
        return IAMClient.createPolicy(policyName, newPolicyDocument);
      }

      const policyVersions = await IAMClient.listPolicyVersions(policyData.Arn);
      if (policyVersions.Versions.length === 5) {
        const firstNonDefaultVersion = policyVersions.Versions.find(
          (version) => !version.IsDefaultVersion,
        );
        await IAMClient.deletePolicyVersion(
          policyData.Arn,
          firstNonDefaultVersion.VersionId,
        );
      }
      const defaultPolicy = await IAMClient.getPolicyVersion(
        policyData.Arn,
        policyData.DefaultVersionId,
      );

      const policyDocument = defaultPolicy.PolicyVersion.Document;
      const decodedPolicyDocument = decodeURIComponent(policyDocument);
      const policyJSON = JSON.parse(decodedPolicyDocument);

      const statementIndex = policyJSON.Statement.findIndex(
        (statement: {
          Effect: string;
          Action: string[];
          Resource: string | string[];
        }) =>
          statement.Effect === 'Allow' &&
          defaultActions.every((action) => statement.Action.includes(action)) &&
          (isImmutable
            ? immutableActions.every((action) =>
                statement.Action.includes(action),
              )
            : true),
      );
      if (statementIndex !== -1) {
        // Get existing resources and ensure it's an array
        const existingResources = Array.isArray(
          policyJSON.Statement[statementIndex].Resource,
        )
          ? policyJSON.Statement[statementIndex].Resource
          : [policyJSON.Statement[statementIndex].Resource];

        // Create new resources to add
        const newResources = bucketsName.flatMap((bucket) => [
          `arn:aws:s3:::${bucket}/*`,
          `arn:aws:s3:::${bucket}`,
        ]);

        // Filter out resources that already exist to avoid duplicates
        const existingResourcesSet = new Set(existingResources);
        const resourcesToAdd = newResources.filter(
          (resource) => !existingResourcesSet.has(resource),
        );

        // Only update if there are new resources to add
        if (resourcesToAdd.length > 0) {
          policyJSON.Statement[statementIndex].Resource = [
            ...existingResources,
            ...resourcesToAdd,
          ];
        }
      } else {
        const newStatement = JSON.parse(newPolicyDocument).Statement[0];
        policyJSON.Statement.push(newStatement);
      }

      //Enforce allow list bucket actions statement on all resources
      const allowListBucketsStatement = policyJSON.Statement.findIndex(
        (statement: {
          Effect: string;
          Action: string[];
          Resource: string | string[];
        }) =>
          statement.Effect === 'Allow' &&
          statement.Action.includes('s3:ListAllMyBuckets') &&
          statement.Action.includes('s3:ListBucket') &&
          statement.Resource === '*',
      );
      if (allowListBucketsStatement === -1) {
        policyJSON.Statement.push(JSON.parse(newPolicyDocument).Statement[1]);
      }

      const updatedPolicyDocument = JSON.stringify(policyJSON, null, 2);
      return IAMClient.createPolicyVersion(
        policyData.Arn,
        updatedPolicyDocument,
      );
    },
  });
};

const useAttachPolicyToUserMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({
      userName,
      policyArn,
    }: {
      userName: string;
      policyArn: string;
    }) => IAMClient.attachUserPolicy(userName, policyArn),
  });
};

const usePutBucketTaggingMutation = () => {
  const s3Client = useS3Client();
  return useMutation(
    ({ bucketName, tagSet }: { bucketName: string; tagSet: TagSetItem[] }) => {
      return s3Client
        .putBucketTagging({
          Bucket: bucketName,
          Tagging: { TagSet: tagSet },
        })
        .promise();
    },
  );
};

const usePutBucketTaggingMutationByS3Client = () => {
  return useMutation({
    mutationFn: ({
      s3Client,
      bucketName,
      tagSet,
    }: {
      s3Client: S3;
      bucketName: string;
      tagSet: TagSetItem[];
    }) =>
      s3Client
        .putBucketTagging({ Bucket: bucketName, Tagging: { TagSet: tagSet } })
        .promise(),
  });
};

const usePutObjectMutation = () => {
  const s3Client = useS3Client();
  const options = {
    partSize: MULTIPART_UPLOAD.partSize,
    queueSize: MULTIPART_UPLOAD.queueSize,
  };
  return useMutation(
    ({ Bucket, Key, Body, ContentType }: S3.PutObjectRequest) =>
      s3Client.upload({ Bucket, Key, Body, ContentType }, options).promise(),
  );
};

const useCreateUserAccessKeyMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({ userName }: { userName: string }) => {
      return IAMClient.createAccessKey(userName);
    },
  });
};

const usePatchZenkoConfigurationMutation = <T>(
  getJsonPatch: (args: T) => string,
) => {
  const { useConfigRetriever, useAuth } = useShellHooks();
  const { getToken } = useAuth();

  const { retrieveConfiguration } = useConfigRetriever();
  const instances = useDeployedMetalk8sInstances();
  const getURL = (instances) => {
    if (instances.length) {
      const runTimeConfig = retrieveConfiguration({
        configType: 'run',
        name: instances[0].name,
      });
      const url = runTimeConfig?.spec.selfConfiguration.url;
      return (
        url + '/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data'
      );
    }
  };
  return useMutation({
    mutationFn: async (args: T) => {
      const result = await fetch(getURL(instances), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json-patch+json',
          authorization: `Bearer ${await getToken()}`,
        },
        body: getJsonPatch(args),
      }).then(async (res) => {
        const response = await res.json();
        if (response.status === 'Success') {
          return response;
        }
        if (response.status === 'Failure') {
          throw new Error(response.message);
        }
        return response;
      });

      let resourceSynchronized = false;
      let isReady = false;
      let pollAttempts = 0;
      const MAX_POLL_ATTEMPTS = 60;

      do {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const r = await fetch(getURL(instances), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${await getToken()}`,
          },
        });
        const response = await r.json();
        if (
          response.metadata.generation === response.status.observedGeneration
        ) {
          resourceSynchronized = true;
        }

        isReady = false;
        if (response.status.conditions) {
          const availableCondition = response.status.conditions.find(
            (cond) => cond.type === 'Available',
          );
          const deploymentCondition = response.status.conditions.find(
            (cond) => cond.type === 'DeploymentInProgress',
          );
          if (
            availableCondition.status === 'True' &&
            deploymentCondition.status === 'False'
          ) {
            isReady = true;
          }
        }
        pollAttempts++;
      } while (
        !(resourceSynchronized && isReady) &&
        pollAttempts < MAX_POLL_ATTEMPTS
      );

      if (!(resourceSynchronized && isReady)) {
        throw new Error(
          'Operation timed out: resource synchronization did not complete within the expected time frame',
        );
      }

      return result;
    },
  });
};

const useEnableSOSAPIMutation = () => {
  return usePatchZenkoConfigurationMutation(() =>
    JSON.stringify([
      {
        op: 'replace',
        path: '/spec/veeamSosApi',
        value: { enable: true },
      },
    ]),
  );
};

const useAddCertificateToZenkoConfigurationMutation = (
  hasExtraCACerts: boolean,
) => {
  return usePatchZenkoConfigurationMutation((args: { certificate: string }) => {
    const patch = hasExtraCACerts
      ? [
          {
            op: 'add',
            path: '/spec/egress/extraCACerts/-',
            value: { 'ca.crt': args.certificate },
          },
        ]
      : [
          {
            op: 'add',
            path: '/spec/egress/extraCACerts',
            value: [{ 'ca.crt': args.certificate }],
          },
        ];

    return JSON.stringify(patch);
  });
};

export {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateEndpointMutation,
  useCreateIAMUserMutation,
  useCreatePolicyMutation,
  useCreateUserAccessKeyMutation,
  usePutBucketTaggingMutation,
  usePutBucketTaggingMutationByS3Client,
  usePutObjectMutation,
  useCreateOrAddBucketToPolicyMutation,
  useEnableSOSAPIMutation,
  useAddCertificateToZenkoConfigurationMutation,
  usePatchZenkoConfigurationMutation,
};
