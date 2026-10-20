import { useCurrentApp, useShellHooks } from '@scality/module-federation';
import { useEffect, useRef, useState } from 'react';
import { type MutationOptions, useMutation, useQueryClient } from 'react-query';
import { useIAMClient } from '../react/IAMProvider';
import { addBucketsToPolicy } from '../react/ISV/utils/ISVPolicy';
import { useManagementClient } from '../react/ManagementProvider';
import { useInstanceId } from '../react/next-architecture/ui/AuthProvider';
import { useDeployedMetalk8sInstances } from '../react/next-architecture/ui/ConfigProvider';
import { getPolicyInfoQuery } from '../react/queries';
import type { ApiError } from '../types/actions';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { createAccountCore } from './accountActions';
import type { EndpointV1 } from './managementClient/api';

export const useWaitForRunningConfigurationVersionToBeUpdated = () => {
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const client = notFalsyTypeGuard(managementClient);
  const runningConfigurationVersionMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      client.setToken(await getToken());
      return (await client.getLatestInstanceStatus(instanceId)).state?.runningConfigurationVersion || 0;
    },
  });
  const versionRef = useRef(0);
  const [status, setStatus] = useState<'idle' | 'refTaken' | 'waiting' | 'success' | 'error'>('idle');
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
          setTimeoutId(setTimeout(waitForRunningConfigurationVersionToBeUpdated, 500));
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
      return notFalsyTypeGuard(client).createConfigurationOverlayEndpoint(params.endpoint, params.uuid);
    },
  });
};

const useCreateAccountMutation = () => {
  const managementClient = useManagementClient();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ user, instanceId }: { user: { userName: string; email: string }; instanceId: string }) => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      return createAccountCore(client, {
        userName: user.userName,
        email: user.email,
        instanceId,
      });
    },
  });
};

const useCreateIAMUserMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({ userName }: { userName: string }) => IAMClient.createUser(userName),
  });
};

const useCreatePolicyMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({ policyName, policyDocument }: { policyName: string; policyDocument: string }) =>
      IAMClient.createPolicy(policyName, policyDocument),
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
        const firstNonDefaultVersion = policyVersions.Versions.find((version) => !version.IsDefaultVersion);
        await IAMClient.deletePolicyVersion(policyData.Arn, firstNonDefaultVersion.VersionId);
      }
      const defaultPolicy = await IAMClient.getPolicyVersion(policyData.Arn, policyData.DefaultVersionId);

      const policyDocument = defaultPolicy.PolicyVersion.Document;
      const decodedPolicyDocument = decodeURIComponent(policyDocument);
      const updatedPolicy = addBucketsToPolicy(
        JSON.parse(decodedPolicyDocument),
        bucketsName,
        JSON.parse(newPolicyDocument),
      );

      const updatedPolicyDocument = JSON.stringify(updatedPolicy, null, 2);
      return IAMClient.createPolicyVersion(policyData.Arn, updatedPolicyDocument);
    },
  });
};

const useAttachPolicyToUserMutation = () => {
  const IAMClient = useIAMClient();
  return useMutation({
    mutationFn: ({ userName, policyArn }: { userName: string; policyArn: string }) =>
      IAMClient.attachUserPolicy(userName, policyArn),
  });
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
  options?: MutationOptions<T, ApiError, T>,
  additionalPollCondition?: () => Promise<boolean>,
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
      return url + '/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data';
    }
  };

  return useMutation({
    mutationFn: async (args: T) => {
      const patchTimestamp = new Date().getTime();
      const result = await fetch(getURL(instances), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json-patch+json',
          authorization: `Bearer ${await getToken()}`,
        },
        body: getJsonPatch(args),
      }).then(async (res: Response) => {
        if (!res.ok) {
          throw new Error(`Failed to patch Zenko configuration: ${res.status} ${res.statusText}`);
        }
        return await res.json();
      });

      let resourceSynchronized = false;
      let isReady = false;
      let pollAttempts = 0;
      const MAX_POLL_ATTEMPTS = 90;
      let deploymentStarted = false;
      let additionalConditionPassed = true;

      do {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const r = await fetch(getURL(instances), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${await getToken()}`,
          },
        });
        if (!r.ok) {
          pollAttempts++;
          continue;
        }
        const response = await r.json();
        if (response.metadata.generation === response.status.observedGeneration) {
          resourceSynchronized = true;
        }

        // Check deployment state from conditions
        if (resourceSynchronized && response.status.conditions) {
          const availableCondition = response.status.conditions.find((cond) => cond.type === 'Available');
          const deploymentCondition = response.status.conditions.find((cond) => cond.type === 'DeploymentInProgress');
          const failureCondition = response.status.conditions.find((cond) => cond.type === 'DeploymentFailure');

          const isDeploymentComplete =
            availableCondition?.status === 'True' &&
            deploymentCondition?.status === 'False' &&
            failureCondition?.status === 'False';

          // Phase 1: Wait for deployment to START (or already complete)
          if (!deploymentStarted) {
            // If a new deployment started after our patch
            if (deploymentCondition && new Date(deploymentCondition.lastTransitionTime).getTime() >= patchTimestamp) {
              deploymentStarted = true;
            }
            // Or if deployment is already complete (no new deployment needed)
            else if (isDeploymentComplete) {
              deploymentStarted = true;
              isReady = true;
            }
          }

          // Phase 2: Wait for deployment to COMPLETE
          if (deploymentStarted && !isReady) {
            isReady = isDeploymentComplete;
          }
        }

        additionalConditionPassed = !additionalPollCondition;
        if (additionalPollCondition && isReady) {
          try {
            additionalConditionPassed = await additionalPollCondition();
          } catch (e) {
            console.warn('additionalPollCondition check failed:', e);
            additionalConditionPassed = false;
          }
        }

        pollAttempts++;
      } while (!(resourceSynchronized && isReady && additionalConditionPassed) && pollAttempts < MAX_POLL_ATTEMPTS);

      if (!(resourceSynchronized && isReady && additionalConditionPassed)) {
        throw new Error(
          'Operation timed out: resource synchronization did not complete within the expected time frame',
        );
      }
      return result;
    },
    ...(options ?? {}),
  });
};

const useEnableSOSAPIMutation = () => {
  const { url } = useCurrentApp();
  return usePatchZenkoConfigurationMutation(
    () =>
      JSON.stringify([
        {
          op: 'replace',
          path: '/spec/veeamSosApi',
          value: { enable: true },
        },
      ]),
    undefined,
    async () => {
      const res = await fetch(`${url}/.well-known/runtime-app-configuration?_t=${Date.now()}`);
      if (!res.ok) return false;
      const config = await res.json();
      return !!config?.spec?.selfConfiguration?.proxy?.veeam;
    },
  );
};

const useAddCertificateToZenkoConfigurationMutation = ({
  hasEgress,
  hasExtraCACerts,
}: {
  hasEgress: boolean;
  hasExtraCACerts: boolean;
}) => {
  return usePatchZenkoConfigurationMutation((args: { certificate: string }) => {
    const patch = !hasEgress
      ? [
          {
            op: 'add',
            path: '/spec/egress',
            value: { extraCACerts: [{ 'ca.crt': args.certificate }] },
          },
        ]
      : hasExtraCACerts
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

const useToggleTLSVerificationMutation = (
  hasEgress: boolean,
  options?: MutationOptions<{ skipTLSVerify: boolean }, ApiError, { skipTLSVerify: boolean }>,
) => {
  const patch = (args: { skipTLSVerify: boolean }) => {
    const patchOp = hasEgress
      ? [
          {
            op: 'replace',
            path: '/spec/egress/skipTLSVerify',
            value: args.skipTLSVerify,
          },
        ]
      : [
          {
            op: 'add',
            path: '/spec/egress',
            value: { skipTLSVerify: args.skipTLSVerify },
          },
        ];

    return JSON.stringify(patchOp);
  };

  return usePatchZenkoConfigurationMutation(patch, options);
};

const useDeleteCertificateFromZenkoConfigurationMutation = (
  options?: MutationOptions<{ certificateIndex: number }, ApiError, { certificateIndex: number }>,
) => {
  const patch = (args: { certificateIndex: number }) => {
    return JSON.stringify([
      {
        op: 'remove',
        path: `/spec/egress/extraCACerts/${args.certificateIndex}`,
      },
    ]);
  };

  return usePatchZenkoConfigurationMutation(patch, options);
};

export {
  useAddCertificateToZenkoConfigurationMutation,
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateEndpointMutation,
  useCreateIAMUserMutation,
  useCreateOrAddBucketToPolicyMutation,
  useCreatePolicyMutation,
  useCreateUserAccessKeyMutation,
  useDeleteCertificateFromZenkoConfigurationMutation,
  useEnableSOSAPIMutation,
  usePatchZenkoConfigurationMutation,
  useToggleTLSVerificationMutation,
};
