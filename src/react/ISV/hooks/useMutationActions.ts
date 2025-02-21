import { useShellHooks } from '@scality/module-federation';
import { useMemo } from 'react';
import { useMutation } from 'react-query';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreateUserAccessKeyMutation,
  usePolicyMutation,
} from '../../../js/mutations';
import { useChainedMutations } from '../../../js/useChainedMutations';
import { useSetAssumedRolePromise } from '../../../react/DataServiceRoleProvider';
import { useAccountsLocationsAndEndpoints } from '../../../react/next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../../react/next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import { ISVConfig, ISVPlatformConfig } from '../types';
import { Account } from '../../next-architecture/domain/entities/account';
import { MutationWithKey } from './useMultiMutation';
import { VEEAM_XML_PREFIX } from '../../ui-elements/Veeam/VeeamConstants';
import { SYSTEM_XML_CONTENT } from '../../ui-elements/Veeam/VeeamConstants';
import { GET_CAPACITY_XML_CONTENT } from '../../ui-elements/Veeam/VeeamConstants';

type Result = {
  data: {
    step: number;
    action: string;
    status: 'success' | 'error' | 'loading' | 'idle';
    retry: () => void;
  }[];
  accessKey: string;
  secretKey: string;
};

export const useMutationActions = (
  props: ISVConfig & {
    platform: ISVPlatformConfig;
    account: Account;
    accessKey: string;
  },
  bucketMutations: Record<string, MutationWithKey>,
): Result => {
  const {
    buckets,
    enableImmutableBackup,
    accountName,
    platform,
    IAMUserNameType,
    IAMUserName,
    account,
    generateKey,
    accessKey,
  } = props;
  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { userData } = useAuth();

  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });

  const setRolePromise = useSetAssumedRolePromise();
  const assumeRoleMutation = useMutation({
    mutationFn: async ({ roleArn }: { roleArn: string }) => {
      return await setRolePromise({ roleArn });
    },
  });

  const createAccountMutation = useCreateAccountMutation();
  const createIAMUserMutation = useCreateIAMUserMutation();
  const createUserAccessKeyMutation = useCreateUserAccessKeyMutation();
  const createPolicyMutation = usePolicyMutation();
  const attachPolicyToUserMutation = useAttachPolicyToUserMutation();

  const generateStepsAndActions = () => {
    const steps = [];
    const actions = [];
    if (!account) {
      actions.push('Create an Account');
      steps.push({
        ...createAccountMutation,
        key: 'createAccount',
      });
      actions.push('Update Configuration');
      steps.push({
        ...refetchAccountsLocationsEndpointsMutation,
        key: 'refetchAccountsLocationsEndpoints',
      });
    }

    actions.push('Assume Account Role');
    steps.push({
      ...assumeRoleMutation,
      key: 'assumeRole',
    });

    buckets.forEach((bucket) => {
      actions.push(
        `Create a Bucket: ${bucket.name}`,
        `Tag Bucket: ${bucket.name}`,
      );
      steps.push(
        bucketMutations[`createBucket-${bucket.name}`],
        bucketMutations[`putBucketTagging-${bucket.name}`],
      );

      if (platform.id === 'veeam') {
        actions.push(
          'Prepare Veeam integrated object repository',
          'Enforce Veeam integrated object repository',
          'Set maximum repository capacity',
        );
        steps.push(
          bucketMutations[`putVeeamFolder-${bucket.name}`],
          bucketMutations[`putVeeamSystemXml-${bucket.name}`],
          bucketMutations[`putVeeamCapacityXml-${bucket.name}`],
        );
      }
    });

    if (!account || IAMUserNameType === 'create') {
      actions.push('Create a User');
      steps.push({
        ...createIAMUserMutation,
        key: 'createIAMUser',
      });

      actions.push('Generate Access key and Secret key');
      steps.push({
        ...createUserAccessKeyMutation,
        key: 'createUserAccessKey',
      });
    }

    if (IAMUserNameType === 'existing' && generateKey) {
      actions.push('Generate Access key and Secret key');
      steps.push({
        ...createUserAccessKeyMutation,
        key: 'createUserAccessKey',
      });
    }

    actions.push('Create Policy');
    steps.push({
      ...createPolicyMutation,
      key: 'createPolicy',
    });

    actions.push('Attach Policy to User');
    steps.push({
      ...attachPolicyToUserMutation,
      key: 'attachPolicyToUser',
    });

    return { actions, steps };
  };

  const { actions, steps } = generateStepsAndActions();

  const getIAMUserName = (results) => {
    const label = 'Create a User';
    const index = actions.findIndex((action) => action === label);
    return results[index].User.UserName;
  };

  const createBucketArray = useMemo(() => {
    return buckets?.reduce(
      (acc, bucket) => ({
        ...acc,
        [`createBucket-${bucket.name}`]: (results) => {
          return {
            s3Client: account ? results[0] : results[2],
            request: {
              ObjectLockEnabledForBucket: enableImmutableBackup,
              Bucket: bucket.name,
            },
          };
        },
      }),
      {},
    );
  }, [buckets, enableImmutableBackup]);

  const putBucketTaggingArray = useMemo(() => {
    return buckets?.reduce(
      (acc, bucket) => ({
        ...acc,
        [`putBucketTagging-${bucket.name}`]: (results) => {
          return {
            s3Client: account ? results[0] : results[2],
            bucketName: bucket.name,
            tagSet: [
              {
                Key: 'X-Scality-Application',
                Value: platform.bucketTag,
              },
            ],
          };
        },
      }),
      {},
    );
  }, [buckets, platform]);

  const putVeeamFolderArray = useMemo(() => {
    return buckets?.reduce(
      (acc, bucket) => ({
        ...acc,
        [`putVeeamFolder-${bucket.name}`]: () => {
          return {
            Bucket: bucket.name,
            Key: `${VEEAM_XML_PREFIX}/`,
            Body: '',
          };
        },
        [`putVeeamSystemXml-${bucket.name}`]: () => {
          return {
            Bucket: bucket.name,
            Key: `${VEEAM_XML_PREFIX}/system.xml`,
            Body: SYSTEM_XML_CONTENT,
            ContentType: 'text/xml',
          };
        },
        [`putVeeamCapacityXml-${bucket.name}`]: () => {
          return {
            Bucket: bucket.name,
            Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
            Body: GET_CAPACITY_XML_CONTENT(bucket.capacityBytes.toString()),
            ContentType: 'text/xml',
          };
        },
      }),
      {},
    );
  }, [buckets]);

  const { mutate, mutationsWithRetry } = useChainedMutations({
    mutations: steps,
    computeVariablesForNext: {
      createAccount: () => ({
        user: {
          userName: accountName,
          email: `${accountName}${userData?.email}`,
        },
        instanceId,
      }),
      refetchAccountsLocationsEndpoints: () => ({}),
      assumeRole: (results) => {
        if (!account) {
          return {
            roleArn: `arn:aws:iam::${
              (results[0] as { id: string }).id
            }:role/scality-internal/storage-manager-role`,
          };
        } else {
          return {
            roleArn: account.preferredAssumableRoleArn,
          };
        }
      },
      ...createBucketArray,
      createIAMUser: () => ({
        userName: IAMUserName || accountName,
      }),
      createUserAccessKey: () => ({
        userName: IAMUserName || accountName,
      }),
      createPolicy: () => {
        return {
          policyName: `${IAMUserName || accountName}-${platform.id}-${
            enableImmutableBackup ? 'immutable' : 'non-immutable'
          }`,
          accountName: accountName,
          bucketsName: buckets.map((bucket) => bucket.name),
          application: platform.id,
          isImmutable: enableImmutableBackup,
        };
      },
      attachPolicyToUser: (results) => {
        if (!account) {
          const name = getIAMUserName(results);
          return {
            userName: name,
            policyArn: `arn:aws:iam::${
              (results[0] as { id: string }).id
            }:policy/${name}-${platform.id}-${
              enableImmutableBackup ? 'immutable' : 'non-immutable'
            }`,
          };
        } else {
          return {
            userName: IAMUserName,
            policyArn: `arn:aws:iam::${account.id}:policy/${IAMUserName}-${
              platform.id
            }-${enableImmutableBackup ? 'immutable' : 'non-immutable'}`,
          };
        }
      },
      ...putBucketTaggingArray,
      ...(platform.id === 'veeam' ? putVeeamFolderArray : {}),
    },
  });

  useMemo(() => {
    mutate();
  }, []);

  const data = steps.map((step, index) => {
    return {
      step: index + 1,
      action: actions[index],
      status:
        steps
          .slice(0, index)
          .map((step) => step.status)
          .filter((status) => status !== 'success').length > 0
          ? 'idle'
          : step.status,
      retry: mutationsWithRetry[index].retry,
    };
  });

  const createAccessKeyLabel = 'Generate Access key and Secret key';
  const accessKeyMutationIndex = actions.findIndex(
    (action) => action === createAccessKeyLabel,
  );

  let secretKey = '';
  if (accessKeyMutationIndex !== -1) {
    secretKey = steps[accessKeyMutationIndex].data?.AccessKey?.SecretAccessKey;
  }

  return {
    data,
    accessKey:
      accessKey || steps[accessKeyMutationIndex]?.data?.AccessKey?.AccessKeyId,
    secretKey,
  };
};
