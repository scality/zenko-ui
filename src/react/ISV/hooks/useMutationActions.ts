import { useShellHooks } from '@scality/module-federation';
import { useMemo } from 'react';
import { useMutation } from 'react-query';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreateUserAccessKeyMutation,
  useCreateOrAddBucketToPolicyMutation,
  useEnableSOSAPIMutation,
  useCreateVeeamRepositoryMutation,
} from '../../../js/mutations';
import { useChainedMutations } from '../../../js/useChainedMutations';
import { useSetAssumedRolePromise } from '../../../react/DataServiceRoleProvider';
import { useAccountsLocationsAndEndpoints } from '../../../react/next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../../react/next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import { ISVConfig, ISVPlatformConfig, VeeamRepositoryData } from '../types';
import { Account } from '../../next-architecture/domain/entities/account';
import { Mutation } from './useMultiMutation';
import { VEEAM_XML_PREFIX } from '../../ISV/constants';
import { SYSTEM_XML_CONTENT } from '../../ISV/constants';
import { GET_CAPACITY_XML_CONTENT } from '../../ISV/constants';
import {} from '../modules/veeam';
import { useCheckSOSAPIStatus } from './useCheckSOSAPIStatus';
import { useIsVeeamVBROnly } from './useIsVeeamVBROnly';
import { useGetS3ServicePoint } from './useGetS3ServicePoint';

type Result = {
  data: {
    step: number;
    action: string;
    status: 'success' | 'error' | 'loading' | 'idle';
    retry: () => void;
  }[];
  accessKey: string;
  secretKey: string;
  repositoryData?: VeeamRepositoryData;
};

export const useMutationActions = (
  props: ISVConfig & {
    platform: ISVPlatformConfig;
    account: Account;
    accessKey: string;
  },
  bucketMutations: Record<string, Mutation>,
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
    autoCreateRepository,
    immutablePeriodDays,
  } = props;
  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { userData } = useAuth();
  const sosApiStatus = useCheckSOSAPIStatus();
  const isVeeamVBROnly = useIsVeeamVBROnly();
  const { s3ServicePoint } = useGetS3ServicePoint();

  const shouldEnableSOSAPI =
    sosApiStatus === 'available' && platform.id === 'veeam-vbr';

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
  const createPolicyMutation = useCreateOrAddBucketToPolicyMutation();
  const attachPolicyToUserMutation = useAttachPolicyToUserMutation();
  const enableSOSAPIMutation = useEnableSOSAPIMutation();
  const createVeeamRepositoryMutation = useCreateVeeamRepositoryMutation();

  const generateStepsAndActions = () => {
    const steps = [];
    const actions = [];
    if (shouldEnableSOSAPI) {
      actions.push('Enable Veeam Smart Object Storage API');
      steps.push({
        ...enableSOSAPIMutation,
        key: 'enableSOSAPI',
      });
    }
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

      if (platform.id === 'veeam-vbr') {
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

    const isCreatingNewPolicy = !account || IAMUserNameType === 'create';
    const policyAction = isCreatingNewPolicy
      ? 'Create Policy'
      : 'Update Policy';

    actions.push(policyAction);
    steps.push({
      ...createPolicyMutation,
      key: 'createPolicy',
    });

    actions.push('Attach Policy to User');
    steps.push({
      ...attachPolicyToUserMutation,
      key: 'attachPolicyToUser',
    });

    // Add Veeam repository creation step if enabled
    if (isVeeamVBROnly && platform.id === 'veeam-vbr' && autoCreateRepository) {
      actions.push('Create Veeam Repository');
      steps.push({
        ...createVeeamRepositoryMutation,
        key: 'createVeeamRepository',
      });
    }

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
          const s3Client = results.find(
            (result) => result?.config?.key === 's3Config',
          );

          return {
            s3Client,
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
          const s3Client = results.find(
            (result) => result?.config?.key === 's3Config',
          );

          return {
            s3Client,
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
      enableSOSAPI: () => ({}),
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
          const accountResponse = results.find(
            (result) => result?.key === 'createAccount',
          );

          return {
            roleArn: `arn:aws:iam::${accountResponse.id}:role/scality-internal/storage-manager-role`,
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
      createPolicy: (results) => {
        const policyName = `${IAMUserName || accountName}-${platform.id}-${
          enableImmutableBackup ? 'immutable' : 'non-immutable'
        }`;
        const accountResponse = results.find(
          (result) => result?.key === 'createAccount',
        );
        const accountId = account ? account.id : accountResponse.id;
        return {
          policyName,
          bucketsName: buckets.map((bucket) => bucket.name),
          isImmutable: enableImmutableBackup,
          policyArn: `arn:aws:iam::${accountId}:policy/${policyName}`,
          getPolicy: platform.getPolicy,
        };
      },
      attachPolicyToUser: (results) => {
        if (!account) {
          const name = getIAMUserName(results);
          const accountResponse = results.find(
            (result) => result?.key === 'createAccount',
          );
          return {
            userName: name,
            policyArn: `arn:aws:iam::${accountResponse.id}:policy/${name}-${
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
      ...(platform.id === 'veeam-vbr' ? putVeeamFolderArray : {}),
      // Add Veeam repository creation parameters
      createVeeamRepository: (results) => {
        const accountResponse = results.find(
          (result) => result?.key === 'createAccount',
        );
        const userAccessKeyResponse = results.find(
          (result) => result?.key === 'createUserAccessKey',
        );
        
        // Get account endpoint - use s3ServicePoint from hook
        const servicePoint = s3ServicePoint || `https://s3.${accountName}.local`;
        const bucketName = buckets?.[0]?.name || '';
        
        return {
          repositoryName: bucketName, // Use bucket name as repository name
          servicePoint,
          accessKey: userAccessKeyResponse?.AccessKey?.AccessKeyId || accessKey,
          secretKey: userAccessKeyResponse?.AccessKey?.SecretAccessKey || '',
          bucketName,
          region: 'us-east-1',
          immutable: enableImmutableBackup || false,
          immutablePeriodDays: immutablePeriodDays || 30,
        };
      },
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
        steps.slice(0, index).filter(({ status }) => {
          return status !== 'success';
        }).length > 0
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

  // Extract repository data if repository was created
  let repositoryData: VeeamRepositoryData | undefined;
  const createRepositoryLabel = 'Create Veeam Repository';
  const repositoryMutationIndex = actions.findIndex(
    (action) => action === createRepositoryLabel,
  );
  
  if (repositoryMutationIndex !== -1 && steps[repositoryMutationIndex]?.data) {
    const repoResponse = steps[repositoryMutationIndex].data;
    repositoryData = {
      repositoryName: repoResponse.repositoryName || '',
      repositoryID: repoResponse.repositoryID || '',
      immutable: enableImmutableBackup || false,
      immutablePeriodDays: immutablePeriodDays,
      status: repoResponse.status || 'success',
    };
  }

  return {
    data,
    accessKey:
      accessKey || steps[accessKeyMutationIndex]?.data?.AccessKey?.AccessKeyId,
    secretKey,
    repositoryData,
  };
};
