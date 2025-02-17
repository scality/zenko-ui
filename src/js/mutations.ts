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
import { getListPoliciesQuery } from '../react/queries';
import { GET_ISV_POLICY } from '../react/ISV/hooks/useBucketMutation';

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
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      const params = {
        uuid: instanceId,
        user,
      };
      return notFalsyTypeGuard(client)
        .createConfigurationOverlayUser(params.user, params.uuid)
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

const usePolicyMutation = () => {
  const IAMClient = useIAMClient();
  const queryClient = useQueryClient();
  // List policies for the account

  // Find if policy already exists for user + app + immutability
  // If yes update the policy
  // List policy versions
  // If there are 5 versions delete the oldest one
  // Create a new policy version

  // If no create a new policy

  return useMutation({
    mutationFn: async ({
      policyName,
      bucketsName,
      accountName,
      application,
      isImmutable,
    }: {
      policyName: string;

      accountName: string;
      bucketsName: string[];
      application: string;
      isImmutable: boolean;
    }) => {
      const policies = await queryClient.fetchQuery(
        getListPoliciesQuery(accountName, IAMClient),
      );
      const policy = policies.Policies.find(
        (policy) => policy.PolicyName === policyName,
      );
      if (!policy) {
        const policyDocument = GET_ISV_POLICY(
          bucketsName,
          application,
          isImmutable,
        );
        return IAMClient.createPolicy(policyName, policyDocument);
      }

      const policyVersions = await IAMClient.listPolicyVersions(policy.Arn);
      if (policyVersions.Versions.length === 5) {
        const firstNonDefaultVersion = policyVersions.Versions.find(
          (version) => !version.IsDefaultVersion,
        );
        await IAMClient.deletePolicyVersion(
          policy.Arn,
          firstNonDefaultVersion.VersionId,
        );
      }
      const defaultPolicy = await IAMClient.getPolicyVersion(
        policy.Arn,
        policy.DefaultVersionId,
      );

      const policyDocument = defaultPolicy.PolicyVersion.Document;
      const policyJSON = JSON.parse(policyDocument);
      policyJSON.Statement[0].Resource.push(
        ...bucketsName
          .map((bucket) => [
            `arn:aws:s3:::${bucket}/*`,
            `arn:aws:s3:::${bucket}`,
          ])
          .flat(),
      );
      const newPolicyDocument = JSON.stringify(policyJSON);
      return IAMClient.createPolicyVersion(policy.Arn, newPolicyDocument);
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

export {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateEndpointMutation,
  useCreateIAMUserMutation,
  useCreatePolicyMutation,
  useCreateUserAccessKeyMutation,
  usePutBucketTaggingMutation,
  usePutObjectMutation,
  usePolicyMutation,
};
