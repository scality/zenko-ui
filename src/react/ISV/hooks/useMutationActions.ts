import { ISVConfig, ISVPlatformConfig } from '../types';
import { useShellHooks } from '@scality/module-federation';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import { useChainedMutations } from '../../../js/useChainedMutations';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreatePolicyMutation,
  useCreateUserAccessKeyMutation,
} from '../../../js/mutations';
import { useAccountsLocationsAndEndpoints } from '../../../react/next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../../react/next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useMutation } from 'react-query';
import { useSetAssumedRolePromise } from '../../../react/DataServiceRoleProvider';
import { useMemo } from 'react';
import { GET_ISV_POLICY } from '../utils/ISVPolicy';
import { useCreateBucket } from '../../../react/next-architecture/domain/business/buckets';

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
  props: ISVConfig & { platform: ISVPlatformConfig },
): Result => {
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
      const result = await setRolePromise({ roleArn });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return result;
    },
  });

  const bucketMutationArray = props.buckets?.map((bucket) => {
    return {
      ...useCreateBucket(),
      key: `createBucket-${bucket.name}`,
    };
  });

  const actions = [
    'Create an Account',
    'Update Configuration',
    'Assume Account Role',
    ...props.buckets.map((bucket) => `Create a Bucket: ${bucket.name}`),
    'Create a User',
    'Generate Access key and Secret key',
    'Create Policy',
    'Attach Policy to User',
  ] as const;

  const getKeys = (steps) => {
    const label = 'Generate Access key and Secret key';
    const index = actions.findIndex((action) => action === label);
    return {
      accessKey: steps[index].data?.AccessKey?.AccessKeyId ?? '',
      secretKey: steps[index].data?.AccessKey?.SecretAccessKey ?? '',
    };
  };

  const steps = [
    // 1. Create an Account
    { ...useCreateAccountMutation(), key: 'createAccount' },
    // 2. Refetch Accounts Locations Endpoints
    {
      ...refetchAccountsLocationsEndpointsMutation,
      key: 'refetchAccountsLocationsEndpoints',
    },
    // 3. Assume Account Role
    { ...assumeRoleMutation, key: 'assumeRole' },

    // 4. Bucket Settings
    ...bucketMutationArray,

    // 5. Create a User
    { ...useCreateIAMUserMutation(), key: 'createIAMUser' },
    // 6. Generate Access key and Secret key
    { ...useCreateUserAccessKeyMutation(), key: 'createUserAccessKey' },

    { ...useCreatePolicyMutation(), key: 'createPolicy' },

    { ...useAttachPolicyToUserMutation(), key: 'attachPolicyToUser' },
  ] as const;

  const createBucketArray = useMemo(() => {
    return props.buckets?.reduce(
      (acc, bucket) => ({
        ...acc,
        [`createBucket-${bucket.name}`]: () => {
          return {
            ObjectLockEnabledForBucket: props.enableImmutableBackup,
            Bucket: bucket.name,
          };
        },
      }),
      {},
    );
  }, [props.buckets, props.enableImmutableBackup, bucketMutationArray]);

  const { mutate, mutationsWithRetry } = useChainedMutations({
    mutations: steps as any,
    computeVariablesForNext: {
      createAccount: () => ({
        user: {
          userName: props.accountName,
          email: `${props.accountName}${userData?.email}`,
        },
        instanceId,
      }),
      refetchAccountsLocationsEndpoints: () => ({}),
      assumeRole: (results) => {
        return {
          roleArn: `arn:aws:iam::${results[0].id}:role/scality-internal/storage-manager-role`,
        };
      },
      ...createBucketArray,
      createIAMUser: () => ({
        userName: props.accountName,
      }),
      createUserAccessKey: () => ({
        userName: props.accountName,
      }),
      createPolicy: () => ({
        policyName: `${props.platform.name}`,
        policyDocument: GET_ISV_POLICY(
          props.buckets.map((bucket) => bucket.name),
          props.application,
          props.enableImmutableBackup,
        ),
      }),
      attachPolicyToUser: (results) => ({
        userName: props.accountName,
        policyArn: `arn:aws:iam::${results[0].id}:policy/${props.platform.name}`,
      }),
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

  return {
    data,
    accessKey: getKeys(steps).accessKey,
    secretKey: getKeys(steps).secretKey,
  };
};
