import { useMemo } from 'react';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreatePolicyMutation,
  useCreateUserAccessKeyMutation,
  usePutBucketTaggingMutation,
  usePutObjectMutation,
} from '../../../js/mutations';
import {
  useAuth,
  useInstanceId,
} from '../../next-architecture/ui/AuthProvider';
import { useSetAssumedRolePromise } from '../../DataServiceRoleProvider';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { VeeamTableProps } from './VeeamTable';
import { useChainedMutations } from '../../../js/useChainedMutations';
import { useMutation } from 'react-query';
import {
  BUCKET_TAG_VEEAM_APPLICATION,
  GET_CAPACITY_XML_CONTENT,
  GET_VEEAM_IMMUTABLE_POLICY,
  GET_VEEAM_NON_IMMUTABLE_POLICY,
  SYSTEM_XML_CONTENT,
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_XML_PREFIX,
} from './VeeamConstants';
import { useCreateBucket } from '../../next-architecture/domain/business/buckets';

export const actions = [
  'Create an Account',
  'Update Configuration',
  'Assume Account Role',
  'Create a Bucket',
  'Create a User',
  'Generate Access key and Secret key',
  'Create Veeam policy',
  'Attach Veeam policy to User',
  'Tag bucket as Veeam Bucket',
  'Prepare Veeam integrated object repository',
  'Enforce Veeam integrated object repository',
  'Set maximum repository capacity',
] as const;

type IndexOf<T extends readonly unknown[], U> = Exclude<
  {
    [K in keyof T]: T[K] extends U ? K : never;
  }[number],
  undefined
>;

type ToNumber<
  T extends string,
  R extends unknown[] = [],
> = T extends `${R['length']}` ? R['length'] : ToNumber<T, [1, ...R]>;

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

export const useMutationTableData = ({
  propsConfiguration,
}: {
  propsConfiguration: VeeamTableProps;
}): Result => {
  const setRolePromise = useSetAssumedRolePromise();

  const assumeRoleMutation = useMutation({
    mutationFn: ({ roleArn }: { roleArn: string }) => {
      return setRolePromise({ roleArn });
    },
  });

  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });

  const mutationsVBO = [
    { ...useCreateAccountMutation(), key: 'createAccountMutation' },
    {
      ...refetchAccountsLocationsEndpointsMutation,
      key: 'refetchAccountsLocationsEndpointsMutation',
    },
    { ...assumeRoleMutation, key: 'assumeRoleMutation' },
    { ...useCreateBucket(), key: 'createBucketMutation' },
    { ...useCreateIAMUserMutation(), key: 'createIAMUserMutation' },
    { ...useCreateUserAccessKeyMutation(), key: 'createUserAccessKeyMutation' },
    { ...useCreatePolicyMutation(), key: 'createPolicyMutation' },
    { ...useAttachPolicyToUserMutation(), key: 'attachPolicyToUserMutation' },
    { ...usePutBucketTaggingMutation(), key: 'putBucketTaggingMutation' },
  ] as const;

  const mutationsVBR = [
    ...mutationsVBO,
    { ...usePutObjectMutation(), key: 'putVeeamFolderMutation' },
    { ...usePutObjectMutation(), key: 'putVeeamSystemXmlMutation' },
    { ...usePutObjectMutation(), key: 'putVeeamCapacityXmlMutation' },
  ] as const;

  const isVeeamVBR =
    propsConfiguration.application === VEEAM_BACKUP_REPLICATION_XML_VALUE;
  const mutations = isVeeamVBR ? mutationsVBR : mutationsVBO;

  const instanceId = useInstanceId();
  const { userData } = useAuth();
  const {
    mutate: mutateVBO,
    mutationsWithRetry: mutationsVBORetry,
    computeVariablesForNext,
  } = useChainedMutations({
    mutations: mutationsVBO,
    computeVariablesForNext: {
      createAccountMutation: () => {
        return {
          user: {
            userName: propsConfiguration.accountName,
            email: `${propsConfiguration.accountName}${userData?.email}`,
          },
          instanceId,
        };
      },
      refetchAccountsLocationsEndpointsMutation: () => {
        return {};
      },
      assumeRoleMutation: (results) => {
        return {
          roleArn: `arn:aws:iam::${results[0]?.id}:role/scality-internal/storage-manager-role`,
        };
      },
      createBucketMutation: () => {
        return {
          Bucket: propsConfiguration.bucketName,
          ObjectLockEnabledForBucket: isVeeamVBR
            ? propsConfiguration.enableImmutableBackup
            : false,
        };
      },
      createIAMUserMutation: () => {
        return {
          userName: propsConfiguration.accountName,
        };
      },
      createUserAccessKeyMutation: () => {
        return {
          userName: propsConfiguration.accountName,
        };
      },
      createPolicyMutation: () => {
        return {
          policyName: `${propsConfiguration.bucketName}-veeam`,
          policyDocument: propsConfiguration.enableImmutableBackup
            ? GET_VEEAM_IMMUTABLE_POLICY(propsConfiguration.bucketName)
            : GET_VEEAM_NON_IMMUTABLE_POLICY(propsConfiguration.bucketName),
        };
      },
      attachPolicyToUserMutation: (results) => {
        return {
          userName: propsConfiguration.accountName,
          policyArn: `arn:aws:iam::${results[0]?.id}:policy/${propsConfiguration.bucketName}-veeam`,
        };
      },
      putBucketTaggingMutation: () => {
        return {
          bucketName: propsConfiguration.bucketName,
          tagSet: [
            {
              Key: BUCKET_TAG_VEEAM_APPLICATION,
              Value: propsConfiguration.application,
            },
          ],
        };
      },
    },
  });

  const { mutate: mutateVBR, mutationsWithRetry: mutationsVBRRetry } =
    useChainedMutations({
      mutations: mutationsVBR,
      computeVariablesForNext: {
        ...computeVariablesForNext,
        putVeeamFolderMutation: () => {
          return {
            Bucket: propsConfiguration.bucketName,
            Key: `${VEEAM_XML_PREFIX}/`,
            Body: '',
          };
        },
        putVeeamSystemXmlMutation: () => {
          return {
            Bucket: propsConfiguration.bucketName,
            Key: `${VEEAM_XML_PREFIX}/system.xml`,
            Body: SYSTEM_XML_CONTENT,
            ContentType: 'text/xml',
          };
        },
        putVeeamCapacityXmlMutation: () => {
          return {
            Bucket: propsConfiguration.bucketName,
            Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
            Body: GET_CAPACITY_XML_CONTENT(propsConfiguration.capacityBytes),
            ContentType: 'text/xml',
          };
        },
      },
    });
  const mutationsWithRetry = isVeeamVBR ? mutationsVBRRetry : mutationsVBORetry;

  useMemo(() => {
    if (isVeeamVBR) {
      mutateVBR();
    } else {
      mutateVBO();
    }
  }, []);

  const data = mutations.map((mutation, index) => {
    return {
      step: index + 1,
      action: actions[index],
      status:
        //Compute the status of the previous mutation
        //If one failed (status === 'error'), default to 'idle', else use mutation.status
        mutations
          .slice(0, index)
          .map((mutation) => mutation.status)
          .filter((status) => status !== 'success').length > 0
          ? 'idle'
          : mutation.status,
      retry: mutationsWithRetry[index].retry,
    };
  });
  const createAccessKeyLabel = 'Generate Access key and Secret key';
  const accessKeyMutationIndex = actions.findIndex(
    (action) => action === createAccessKeyLabel,
  ) as ToNumber<IndexOf<typeof actions, typeof createAccessKeyLabel>>;
  return {
    data,
    accessKey:
      mutations[accessKeyMutationIndex].data?.AccessKey?.AccessKeyId ?? '',
    secretKey:
      mutations[accessKeyMutationIndex].data?.AccessKey?.SecretAccessKey ?? '',
  };
};
