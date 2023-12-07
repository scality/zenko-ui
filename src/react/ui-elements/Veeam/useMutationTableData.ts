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
    useCreateAccountMutation(),
    refetchAccountsLocationsEndpointsMutation,
    assumeRoleMutation,
    useCreateBucket(),
    useCreateIAMUserMutation(),
    useCreateUserAccessKeyMutation(),
    useCreatePolicyMutation(),
    useAttachPolicyToUserMutation(),
    usePutBucketTaggingMutation(),
  ];

  const mutationsVeeamVBR = [
    useCreateAccountMutation(),
    refetchAccountsLocationsEndpointsMutation,
    assumeRoleMutation,
    useCreateBucket(),
    useCreateIAMUserMutation(),
    useCreateUserAccessKeyMutation(),
    useCreatePolicyMutation(),
    useAttachPolicyToUserMutation(),
    usePutBucketTaggingMutation(),
    usePutObjectMutation(),
    usePutObjectMutation(),
    usePutObjectMutation(),
  ];

  const isVeeamVBR =
    propsConfiguration.application === VEEAM_BACKUP_REPLICATION_XML_VALUE;
  const mutations = isVeeamVBR ? mutationsVeeamVBR : mutationsVBO;

  const instanceId = useInstanceId();
  const { userData } = useAuth();
  const { mutate, mutationsWithRetry } = useChainedMutations({ mutations });

  useMemo(() => {
    mutate((results) => {
      const isStep = (stepName: (typeof actions)[number]) => {
        return (
          results.length === actions.findIndex((action) => action === stepName)
        );
      };
      if (isStep('Create an Account')) {
        return {
          user: {
            userName: propsConfiguration.accountName,
            email: `${propsConfiguration.bucketName}${userData?.email}`,
          },
          instanceId,
        };
      } else if (isStep('Update Configuration')) {
        return {};
      } else if (isStep('Assume Account Role')) {
        return {
          roleArn: `arn:aws:iam::${results[0].id}:role/scality-internal/storage-manager-role`,
        };
      } else if (isStep('Create a Bucket')) {
        return {
          Bucket: propsConfiguration.bucketName,
          ObjectLockEnabledForBucket: isVeeamVBR
            ? propsConfiguration.enableImmutableBackup
            : false,
        };
      } else if (isStep('Create a User')) {
        return {
          userName: propsConfiguration.accountName,
        };
      } else if (isStep('Generate Access key and Secret key')) {
        return {
          userName: propsConfiguration.accountName,
        };
      } else if (isStep('Create Veeam policy')) {
        return {
          policyName: `${propsConfiguration.bucketName}-veeam`,
          policyDocument: GET_VEEAM_IMMUTABLE_POLICY(
            propsConfiguration.bucketName,
          ),
        };
      } else if (isStep('Attach Veeam policy to User')) {
        return {
          userName: propsConfiguration.accountName,
          policyArn: `arn:aws:iam::${results[0].id}:policy/${propsConfiguration.bucketName}-veeam`,
        };
      } else if (isStep('Tag bucket as Veeam Bucket')) {
        return {
          bucketName: propsConfiguration.bucketName,
          tagSet: [
            {
              Key: BUCKET_TAG_VEEAM_APPLICATION,
              Value: propsConfiguration.application,
            },
          ],
        };
      } else if (isStep('Prepare Veeam integrated object repository')) {
        return {
          Bucket: propsConfiguration.bucketName,
          Key: `${VEEAM_XML_PREFIX}/`,
          Body: '',
        };
      } else if (isStep('Enforce Veeam integrated object repository')) {
        return {
          Bucket: propsConfiguration.bucketName,
          Key: `${VEEAM_XML_PREFIX}/system.xml`,
          Body: SYSTEM_XML_CONTENT,
          ContentType: 'text/xml',
        };
      } else if (isStep('Set maximum repository capacity')) {
        return {
          Bucket: propsConfiguration.bucketName,
          Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
          Body: GET_CAPACITY_XML_CONTENT(propsConfiguration.capacityBytes),
          ContentType: 'text/xml',
        };
      }
    });
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
  const accessKeyMutationIndex = actions.findIndex(
    (action) => action === 'Generate Access key and Secret key',
  );
  return {
    data,
    accessKey: mutations[accessKeyMutationIndex].data?.AccessKey?.AccessKeyId,
    secretKey:
      mutations[accessKeyMutationIndex].data?.AccessKey?.SecretAccessKey,
  };
};
