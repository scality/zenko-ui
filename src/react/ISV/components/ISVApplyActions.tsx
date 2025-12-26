import { Form, Icon, Stack, Text } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import Table, * as T from '../../ui-elements/Table';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useCallback, useMemo, memo, useState } from 'react';
import { useQueryClient, useMutation } from 'react-query';
import styled, { useTheme } from 'styled-components';
import {
  useBasenameRelativeNavigate,
  useShellHooks,
} from '@scality/module-federation';
import { ISVStepsIndexes, ISV_STEPS } from './ISVSteps';
import { ISVSkipModal } from './ISVSkipModal';
import { ISVConfig, ISVPlatformConfig } from '../types';
import { Account } from '../../next-architecture/domain/entities/account';
import {
  useChainedMutations,
  MutationConfig,
  VariablesResolvers,
  PreviousResults,
} from '@scality/react-chained-query';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreateUserAccessKeyMutation,
  useCreateOrAddBucketToPolicyMutation,
  useEnableSOSAPIMutation,
  usePutBucketTaggingMutationByS3Client,
  usePutObjectMutation,
} from '../../../js/mutations';
import { useCreateBucketByS3Client } from '../../next-architecture/domain/business/buckets';
import { useSetAssumedRolePromise } from '../../DataServiceRoleProvider';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import { useCheckSOSAPIStatus } from '../hooks/useCheckSOSAPIStatus';
import {
  VEEAM_XML_PREFIX,
  SYSTEM_XML_CONTENT,
  GET_CAPACITY_XML_CONTENT,
} from '../constants';

const StatusBox = styled(Box)`
  display: flex;
  gap: 8px;
  align-items: center;
`;

type ISVApplyActionsProps = ISVConfig & {
  platform: ISVPlatformConfig;
  account: null | Account;
  accessKey: string;
  secretKey: string;
  accessKeys?: string[];
};

// ============================================================================
// Custom hooks that need special handling
// ============================================================================

const useRefetchConfig = () => {
  const adapter = useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter: adapter,
    });
  return refetchAccountsLocationsEndpointsMutation;
};

const useAssumeRole = () => {
  const setRolePromise = useSetAssumedRolePromise();
  return useMutation({
    mutationFn: async ({ roleArn }: { roleArn: string }) => {
      const s3Config = await setRolePromise({ roleArn });
      return s3Config;
    },
  });
};

// ============================================================================
// Status Display Component
// ============================================================================

const ChainStatusDisplay = memo(function ChainStatusDisplay({
  props,
  steps,
  isComplete,
  hasError,
  getResult,
}: {
  props: ISVApplyActionsProps;
  steps: Array<{
    id: string;
    label: string;
    step: number;
    status: 'idle' | 'pending' | 'success' | 'error';
    retry: () => void;
  }>;
  isComplete: boolean;
  hasError: boolean;
  getResult: <T = unknown>(id: string) => T | undefined;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const theme = useTheme();
  const navigate = useBasenameRelativeNavigate();
  const queryClient = useQueryClient();
  const { next } = useStepper(ISVStepsIndexes.ApplyActions, ISV_STEPS);

  const {
    buckets,
    enableImmutableBackup,
    accountName,
    application,
    platform,
    accessKey,
    accessKeys,
  } = props;

  const accessKeyData = getResult<{
    AccessKey: { AccessKeyId: string; SecretAccessKey: string };
  }>('createUserAccessKey');
  const finalAccessKey =
    accessKey || accessKeyData?.AccessKey?.AccessKeyId || '';
  const finalSecretKey = accessKeyData?.AccessKey?.SecretAccessKey || '';

  const handleContinue = useCallback(() => {
    queryClient.invalidateQueries(['WebIdentityRoles']);
    next({
      accountName,
      buckets,
      enableImmutableBackup,
      accessKey: finalAccessKey,
      secretKey: finalSecretKey,
      application,
      accessKeys,
    });
  }, [
    accountName,
    buckets,
    enableImmutableBackup,
    finalAccessKey,
    finalSecretKey,
    application,
    accessKeys,
    queryClient,
    next,
  ]);

  const handleExit = useCallback(() => {
    setConfirmCancel(true);
    queryClient.invalidateQueries(['WebIdentityRoles']);
  }, [queryClient]);

  return (
    <>
      <ISVSkipModal
        isOpen={confirmCancel}
        close={() => setConfirmCancel(false)}
        exitAction={() => navigate('/')}
        title={`Exit ${platform.name} Assistant Configuration`}
        modalContent={platform.skipModalContent}
      />
      <Form
        layout={{
          title: `Configure ARTESCA for ${platform.name}`,
          kind: 'page',
        }}
        requireMode="all"
        rightActions={
          <Stack gap="r16">
            <Button
              type="button"
              disabled={!hasError}
              variant="outline"
              label="Exit"
              onClick={handleExit}
            />
            <Button
              disabled={!isComplete}
              variant="primary"
              type="button"
              label="Continue"
              icon={<Icon name="Arrow-right" />}
              onClick={handleContinue}
            />
          </Stack>
        }
        style={{ width: '50rem' }}
      >
        <div style={{ height: '32rem' }}>
          <Table>
            <T.Head>
              <T.HeadRow style={{ display: 'flex' }}>
                <T.HeadCell style={{ width: '150px' }}>Step</T.HeadCell>
                <T.HeadCell style={{ width: '50%' }}>Action</T.HeadCell>
                <T.HeadCell style={{ width: '12.5%' }}>Status</T.HeadCell>
              </T.HeadRow>
            </T.Head>
            <T.Body>
              {steps.map((row) => (
                <T.Row key={row.id} style={{ display: 'flex' }}>
                  <T.Cell style={{ width: '150px' }}>{row.step}</T.Cell>
                  <T.Cell style={{ width: '50%' }}>
                    <Text>{row.label}</Text>
                  </T.Cell>
                  <T.Cell style={{ width: '12.5%' }}>
                    {row.status === 'success' ? (
                      <StatusBox>
                        <Icon name="Check" color={theme.statusHealthy} />
                        <span>Success</span>
                      </StatusBox>
                    ) : row.status === 'error' ? (
                      <StatusBox>
                        <Icon
                          name="Exclamation-triangle"
                          color={theme.statusCritical}
                        />
                        <span>Failed</span>
                        <Button
                          icon={<Icon name="Redo" />}
                          variant="secondary"
                          type="button"
                          label="Retry"
                          onClick={row.retry}
                        />
                      </StatusBox>
                    ) : (
                      <span>Pending...</span>
                    )}
                  </T.Cell>
                </T.Row>
              ))}
            </T.Body>
          </Table>
        </div>
      </Form>
    </>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export default memo(function ISVApplyActions(props: ISVApplyActionsProps) {
  const {
    buckets = [],
    enableImmutableBackup,
    accountName,
    platform,
    IAMUserNameType,
    IAMUserName,
    account,
    generateKey,
  } = props;

  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { userData } = useAuth();
  const sosApiStatus = useCheckSOSAPIStatus();

  const shouldEnableSOSAPI =
    sosApiStatus === 'available' && platform.id === 'veeam-vbr';
  const isVeeamVBR = platform.id === 'veeam-vbr';
  const needsIAMUser = !account || IAMUserNameType === 'create';
  const needsAccessKey =
    needsIAMUser || (IAMUserNameType === 'existing' && generateKey);

  const enableSOSAPIMutation = useEnableSOSAPIMutation();
  const createAccountMutation = useCreateAccountMutation();
  const refetchConfigMutation = useRefetchConfig();
  const assumeRoleMutation = useAssumeRole();
  const createIAMUserMutation = useCreateIAMUserMutation();
  const createUserAccessKeyMutation = useCreateUserAccessKeyMutation();
  const createPolicyMutation = useCreateOrAddBucketToPolicyMutation();
  const attachPolicyToUserMutation = useAttachPolicyToUserMutation();

  const mutations = useMemo((): MutationConfig[] => {
    const result: MutationConfig[] = [];

    if (shouldEnableSOSAPI) {
      result.push({
        id: 'enableSOSAPI',
        label: 'Enable Veeam Smart Object Storage API',
        mutation: enableSOSAPIMutation,
      });
    }

    if (!account) {
      result.push({
        id: 'createAccount',
        label: 'Create an Account',
        mutation: createAccountMutation,
      });
      result.push({
        id: 'refetchConfig',
        label: 'Update Configuration',
        mutation: refetchConfigMutation,
      });
    }

    result.push({
      id: 'assumeRole',
      label: 'Assume Account Role',
      mutation: assumeRoleMutation,
    });

    // Dynamic bucket operations
    buckets.forEach((bucket) => {
      result.push({
        id: `createBucket-${bucket.name}`,
        label: `Create Bucket: ${bucket.name}`,
        hook: useCreateBucketByS3Client,
      });
      result.push({
        id: `tagBucket-${bucket.name}`,
        label: `Tag Bucket: ${bucket.name}`,
        hook: usePutBucketTaggingMutationByS3Client,
      });
      if (isVeeamVBR) {
        result.push({
          id: `veeamFolder-${bucket.name}`,
          label: 'Prepare Veeam repository',
          hook: usePutObjectMutation,
        });
        result.push({
          id: `veeamSystem-${bucket.name}`,
          label: 'Enforce Veeam repository',
          hook: usePutObjectMutation,
        });
        result.push({
          id: `veeamCapacity-${bucket.name}`,
          label: 'Set repository capacity',
          hook: usePutObjectMutation,
        });
      }
    });

    if (needsIAMUser) {
      result.push({
        id: 'createIAMUser',
        label: 'Create a User',
        mutation: createIAMUserMutation,
      });
    }
    if (needsAccessKey) {
      result.push({
        id: 'createUserAccessKey',
        label: 'Generate Access key and Secret key',
        mutation: createUserAccessKeyMutation,
      });
    }

    result.push({
      id: 'createPolicy',
      label: needsIAMUser ? 'Create Policy' : 'Update Policy',
      mutation: createPolicyMutation,
    });
    result.push({
      id: 'attachPolicyToUser',
      label: 'Attach Policy to User',
      mutation: attachPolicyToUserMutation,
    });

    return result;
  }, [
    shouldEnableSOSAPI,
    !!account,
    buckets,
    isVeeamVBR,
    needsIAMUser,
    needsAccessKey,
    enableSOSAPIMutation.status,
    createAccountMutation.status,
    refetchConfigMutation.status,
    assumeRoleMutation.status,
    createIAMUserMutation.status,
    createUserAccessKeyMutation.status,
    createPolicyMutation.status,
    attachPolicyToUserMutation.status,
  ]);

  const variables = useMemo((): VariablesResolvers => {
    const resolvers: VariablesResolvers = {
      enableSOSAPI: () => ({}),
      createAccount: () => ({
        user: {
          userName: accountName,
          email: `${accountName}${userData?.email}`,
        },
        instanceId,
      }),
      refetchConfig: () => ({}),
      assumeRole: (prev: PreviousResults) => {
        if (account) {
          return { roleArn: account.preferredAssumableRoleArn };
        }
        const acc = prev.createAccount?.data as { id: string } | undefined;
        if (!acc?.id) {
          throw new Error('Account creation failed - cannot assume role');
        }
        return {
          roleArn: `arn:aws:iam::${acc.id}:role/scality-internal/storage-manager-role`,
        };
      },
      createIAMUser: () => ({ userName: IAMUserName || accountName }),
      createUserAccessKey: () => ({ userName: IAMUserName || accountName }),
      createPolicy: (prev: PreviousResults) => {
        const policyName = `${IAMUserName || accountName}-${platform.id}-${
          enableImmutableBackup ? 'immutable' : 'non-immutable'
        }`;
        const acc = prev.createAccount?.data as { id: string } | undefined;
        const accountId = account?.id || acc?.id;
        if (!accountId) {
          throw new Error('Account ID not available - cannot create policy');
        }
        return {
          policyName,
          bucketsName: buckets.map((b) => b.name),
          isImmutable: enableImmutableBackup,
          policyArn: `arn:aws:iam::${accountId}:policy/${policyName}`,
          getPolicy: platform.getPolicy,
        };
      },
      attachPolicyToUser: (prev: PreviousResults) => {
        const user = prev.createIAMUser?.data as
          | { User: { UserName: string } }
          | undefined;
        const acc = prev.createAccount?.data as { id: string } | undefined;
        const userName = IAMUserName || user?.User?.UserName || accountName;
        const accountId = account?.id || acc?.id;
        return {
          userName,
          policyArn: `arn:aws:iam::${accountId}:policy/${userName}-${
            platform.id
          }-${enableImmutableBackup ? 'immutable' : 'non-immutable'}`,
        };
      },
    };

    // Bucket operations - need s3Client from assumeRole result
    // 4.2 version will use data-browser-library and can fix this by the Context API
    buckets.forEach((bucket) => {
      resolvers[`createBucket-${bucket.name}`] = (prev: PreviousResults) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s3Client = (prev.assumeRole?.data as any) || null;
        return {
          s3Client,
          request: {
            ObjectLockEnabledForBucket: enableImmutableBackup,
            Bucket: bucket.name,
          },
        };
      };

      resolvers[`tagBucket-${bucket.name}`] = (prev: PreviousResults) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s3Client = (prev.assumeRole?.data as any) || null;
        return {
          s3Client,
          bucketName: bucket.name,
          tagSet: [{ Key: 'X-Scality-Application', Value: platform.bucketTag }],
        };
      };

      if (isVeeamVBR) {
        resolvers[`veeamFolder-${bucket.name}`] = () => ({
          Bucket: bucket.name,
          Key: `${VEEAM_XML_PREFIX}/`,
          Body: '',
        });
        resolvers[`veeamSystem-${bucket.name}`] = () => ({
          Bucket: bucket.name,
          Key: `${VEEAM_XML_PREFIX}/system.xml`,
          Body: SYSTEM_XML_CONTENT,
          ContentType: 'text/xml',
        });
        resolvers[`veeamCapacity-${bucket.name}`] = () => ({
          Bucket: bucket.name,
          Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
          Body: GET_CAPACITY_XML_CONTENT(
            bucket.capacityBytes?.toString() || '0',
          ),
          ContentType: 'text/xml',
        });
      }
    });

    return resolvers;
  }, [
    accountName,
    userData?.email,
    instanceId,
    account,
    IAMUserName,
    platform,
    enableImmutableBackup,
    buckets,
    isVeeamVBR,
  ]);

  const { Slots, steps, isComplete, hasError, getResult } = useChainedMutations(
    {
      mutations,
      variables,
    },
  );

  return (
    <>
      {Slots}
      <ChainStatusDisplay
        props={props}
        steps={steps}
        isComplete={isComplete}
        hasError={hasError}
        getResult={getResult}
      />
    </>
  );
});
