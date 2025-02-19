import { useShellHooks } from '@scality/module-federation';
import { useMemo } from 'react';
import { useMutation } from 'react-query';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreateUserAccessKeyMutation,
  usePolicyMutation,
  usePutBucketTaggingMutation,
} from '../../../js/mutations';
import { useChainedMutations } from '../../../js/useChainedMutations';
import { useSetAssumedRolePromise } from '../../../react/DataServiceRoleProvider';
import { useAccountsLocationsAndEndpoints } from '../../../react/next-architecture/domain/business/accounts';
import {
  useCreateBucket,
  useCreateBucketByS3Client,
} from '../../../react/next-architecture/domain/business/buckets';
import { useAccountsLocationsEndpointsAdapter } from '../../../react/next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import { ISVConfig, ISVPlatformConfig } from '../types';
import { Account } from '../../next-architecture/domain/entities/account';

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

  const createBucketMutation = account
    ? useCreateBucket()
    : useCreateBucketByS3Client();

  const putBucketTaggingMutation = usePutBucketTaggingMutation();

  const generateStepsAndActions = () => {
    const steps = [];
    const actions = [];
    if (!account) {
      actions.push('Create an Account');
      steps.push({
        ...useCreateAccountMutation(),
        key: 'createAccount',
      });
      actions.push('Update Configuration');
      steps.push({
        ...refetchAccountsLocationsEndpointsMutation,
        key: 'refetchAccountsLocationsEndpoints',
      });
      actions.push('Assume Account Role');
      steps.push({
        ...assumeRoleMutation,
        key: 'assumeRole',
      });
    }

    buckets.forEach((bucket) => {
      actions.push(
        `Create a Bucket: ${bucket.name}`,
        `Tag Bucket: ${bucket.name}`,
      );
      steps.push(
        {
          ...createBucketMutation,
          key: `createBucket-${bucket.name}`,
        },
        {
          ...putBucketTaggingMutation,
          key: `putBucketTagging-${bucket.name}`,
        },
      );
    });

    if (!account || IAMUserNameType === 'create') {
      actions.push('Create a User');
      steps.push({
        ...useCreateIAMUserMutation(),
        key: 'createIAMUser',
      });

      actions.push('Generate Access key and Secret key');
      steps.push({
        ...useCreateUserAccessKeyMutation(),
        key: 'createUserAccessKey',
      });
    }

    if (IAMUserNameType === 'existing' && generateKey) {
      actions.push('Generate Access key and Secret key');
      steps.push({
        ...useCreateUserAccessKeyMutation(),
        key: 'createUserAccessKey',
      });
    }

    actions.push('Create Policy');
    steps.push({
      ...usePolicyMutation(),
      key: 'createPolicy',
    });

    actions.push('Attach Policy to User');
    steps.push({
      ...useAttachPolicyToUserMutation(),
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
          if (account) {
            return {
              ObjectLockEnabledForBucket: enableImmutableBackup,
              Bucket: bucket.name,
            };
          } else {
            return {
              s3Client: results[2],
              request: {
                ObjectLockEnabledForBucket: enableImmutableBackup,
                Bucket: bucket.name,
              },
            };
          }
        },
      }),
      {},
    );
  }, [buckets, enableImmutableBackup]);

  const putBucketTaggingArray = useMemo(() => {
    return buckets?.reduce(
      (acc, bucket) => ({
        ...acc,
        [`putBucketTagging-${bucket.name}`]: () => {
          return {
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
            roleArn: `arn:aws:iam::${results[0].id}:role/scality-internal/storage-manager-role`,
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
            policyArn: `arn:aws:iam::${results[0].id}:policy/${name}-${
              platform.id
            }-${enableImmutableBackup ? 'immutable' : 'non-immutable'}`,
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
      accessKey || steps[accessKeyMutationIndex].data?.AccessKey?.AccessKeyId,
    secretKey,
  };
};
