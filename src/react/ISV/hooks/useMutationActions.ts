import { ISVApplyActionsProps } from '../components/ISVApplyActions';
import { useShellHooks } from '@scality/module-federation';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import { useChainedMutations } from '../../../js/useChainedMutations';
import {
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreateUserAccessKeyMutation,
} from '../../../js/mutations';
import { useAccountsLocationsAndEndpoints } from '../../../react/next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../../react/next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useMutation } from 'react-query';
import { useSetAssumedRolePromise } from '../../../react/DataServiceRoleProvider';
import { useMemo } from 'react';
import { useBucketMutation } from './useBucketMutation';

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

const actions = [
  'Create an Account',
  'Update Configuration',
  'Assume Account Role',
  'Create a User',
  'Generate Access key and Secret key',
] as const;

const getKeys = (steps) => {
  const label = 'Generate Access key and Secret key';
  const index = actions.findIndex((action) => action === label);
  return {
    accessKey: steps[index].data?.AccessKey?.AccessKeyId ?? '',
    secretKey: steps[index].data?.AccessKey?.SecretAccessKey ?? '',
  };
};

export const useMutationActions = (props: ISVApplyActionsProps): Result => {
  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { userData } = useAuth();

  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });

  const setRolePromise = useSetAssumedRolePromise();

  const assumeRoleMutation = useMutation({
    mutationFn: ({ roleArn }: { roleArn: string }) => {
      return setRolePromise({ roleArn });
    },
  });

  const bucketMutationArray =
    props.buckets?.map((bucket) => {
      return {
        ...useBucketMutation(bucket),
        key: `bucketMutation`,
      };
    }) ?? [];

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

    //TODO 4. Bucket Settings

    // 5. Create a User
    { ...useCreateIAMUserMutation(), key: 'createIAMUser' },
    // 6. Generate Access key and Secret key
    { ...useCreateUserAccessKeyMutation(), key: 'createUserAccessKey' },
  ] as const;

  const { mutate, mutationsWithRetry } = useChainedMutations({
    mutations: steps,
    computeVariablesForNext: {
      createAccount: () => ({
        user: {
          userName: props.accountName,
          email: `${props.accountName}${userData?.email}`,
        },
        instanceId,
      }),
      refetchAccountsLocationsEndpoints: () => ({}),
      assumeRole: (results) => ({
        roleArn: `arn:aws:iam::${results[0]?.id}:role/scality-internal/storage-manager-role`,
      }),
      createIAMUser: () => ({
        userName: props.accountName,
      }),
      createUserAccessKey: () => ({
        userName: props.accountName,
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
