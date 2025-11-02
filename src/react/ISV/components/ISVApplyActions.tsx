import { Form, Icon, Stack, Text } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import Table, * as T from '../../ui-elements/Table';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import { useQueryClient } from 'react-query';
import styled, { useTheme } from 'styled-components';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ISVStepsIndexes, ISV_STEPS } from './ISVSteps';
import { memo } from 'react';
import { ISVSkipModal } from './ISVSkipModal';
import { useMutationActions } from '../hooks/useMutationActions';
import { Bucket, ISVConfig, ISVPlatformConfig } from '../types';
import { Account } from '../../next-architecture/domain/entities/account';
import { useMultiMutation, Mutation } from '../hooks/useMultiMutation';
import { useS3Hooks } from '../../next-architecture/adapters/s3/DataBrowserHookFactory';
import { S3OperationConfig } from '../../next-architecture/domain/interfaces/IS3Operations';
import { getISVOperationConfig } from '../config/ISVOperationConfig';
import { DataBrowserIsolatedWrapper } from '../DataBrowserIsolatedWrapper';
import { useAssumedRole } from '../../DataServiceRoleProvider';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { createDataBrowserS3Config } from '../../next-architecture/adapters/s3/createDataBrowserS3Config';
import Loader from '../../ui-elements/Loader';

export const ListItem = styled.li`
  padding: 0.5rem;
`;

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

const BucketMutation = ({
  bucket,
  onMutationReady,
  config,
}: {
  bucket: Bucket;
  onMutationReady: (key: string, mutation: Mutation) => void;
  config: S3OperationConfig;
}) => {
  const s3Hooks = useS3Hooks(config);
  const createBucketMutation = s3Hooks.useCreateBucket();
  const setBucketTaggingMutation = s3Hooks.useSetBucketTagging();

  useEffect(() => {
    onMutationReady(`createBucket-${bucket.name}`, createBucketMutation);
  }, [bucket.name, onMutationReady, createBucketMutation.status]);

  useEffect(() => {
    onMutationReady(
      `putBucketTagging-${bucket.name}`,
      setBucketTaggingMutation,
    );
  }, [bucket.name, onMutationReady, setBucketTaggingMutation.status]);

  return <></>;
};

const BucketVeeamMutation = ({
  bucket,
  onMutationReady,
  config,
}: {
  bucket: Bucket;
  onMutationReady: (key: string, mutation: Mutation) => void;
  config: S3OperationConfig;
}) => {
  const s3Hooks = useS3Hooks(config);
  const putVeeamFolderMutation = s3Hooks.usePutObject();
  const putVeeamSystemXmlMutation = s3Hooks.usePutObject();
  const putVeeamCapacityXmlMutation = s3Hooks.usePutObject();

  useEffect(() => {
    onMutationReady(`putVeeamFolder-${bucket.name}`, putVeeamFolderMutation);
  }, [bucket.name, onMutationReady, putVeeamFolderMutation.status]);

  useEffect(() => {
    onMutationReady(
      `putVeeamSystemXml-${bucket.name}`,
      putVeeamSystemXmlMutation,
    );
  }, [bucket.name, onMutationReady, putVeeamSystemXmlMutation.status]);

  useEffect(() => {
    onMutationReady(
      `putVeeamCapacityXml-${bucket.name}`,
      putVeeamCapacityXmlMutation,
    );
  }, [bucket.name, onMutationReady, putVeeamCapacityXmlMutation.status]);

  return <></>;
};
const Main = ({
  props,
  mutations,
}: {
  props: ISVApplyActionsProps;
  mutations: Record<string, Mutation>;
}) => {
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
    accessKeys,
  } = props;
  const { data, accessKey, secretKey } = useMutationActions(props, mutations);

  const isCancellable = useMemo(
    () => data.some((row) => row.status === 'error'),
    [data],
  );
  const isContinue = useMemo(
    () => data.every((row) => row.status === 'success'),
    [data],
  );

  const handleContinue = useCallback(() => {
    queryClient.invalidateQueries(['WebIdentityRoles']);
    next({
      accountName,
      buckets,
      enableImmutableBackup,
      accessKey,
      secretKey,
      application,
      accessKeys,
    });
  }, [
    accountName,
    buckets,
    enableImmutableBackup,
    accessKey,
    secretKey,
    application,
    accessKeys,
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
              disabled={!isCancellable}
              variant="outline"
              label="Exit"
              onClick={handleExit}
            />
            <Button
              disabled={!isContinue}
              variant="primary"
              label={'Continue'}
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
              {data.map((row, index) => (
                <T.Row key={index} style={{ display: 'flex' }}>
                  <T.Cell style={{ width: '150px' }}>{row.step}</T.Cell>
                  <T.Cell style={{ width: '50%' }}>
                    <div>
                      <Text>{row.action}</Text>
                    </div>
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
};

export default memo(function ISVApplyActions(props: ISVApplyActionsProps) {
  const { buckets, platform, enableImmutableBackup } = props;
  const isVeeamVBR = platform.id === 'veeam-vbr';
  const { mutations, handleMutationReady, isAllMutationsReady } =
    useMultiMutation(
      buckets,
      isVeeamVBR ? buckets.length * 5 : buckets.length * 2,
    );

  const isvConfig = useMemo(() => {
    return getISVOperationConfig(platform, enableImmutableBackup);
  }, [platform, enableImmutableBackup]);

  // Get S3 configuration from assumed role context to avoid react-query v3 conflicts
  const assumedRole = useAssumedRole();
  const { zenkoEndpoint } = useConfig();

  const s3Config = useMemo(() => {
    const credentials = assumedRole?.Credentials;
    if (
      !credentials?.AccessKeyId ||
      !credentials?.SecretAccessKey ||
      !credentials?.SessionToken
    ) {
      return null;
    }

    return createDataBrowserS3Config({
      zenkoEndpoint,
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
      },
      region: isvConfig.region,
    });
  }, [assumedRole?.Credentials, zenkoEndpoint, isvConfig.region]);

  // Show loading if credentials are not available yet
  if (!s3Config) {
    return (
      <Loader>
        <>Loading S3 credentials...</>
      </Loader>
    );
  }

  return (
    <>
      <DataBrowserIsolatedWrapper config={isvConfig} s3Config={s3Config}>
        {buckets.map((bucket) => (
          <Fragment key={bucket.name}>
            <BucketMutation
              bucket={bucket}
              onMutationReady={handleMutationReady}
              config={isvConfig}
            />
            {isVeeamVBR && (
              <BucketVeeamMutation
                bucket={bucket}
                onMutationReady={handleMutationReady}
                config={isvConfig}
              />
            )}
          </Fragment>
        ))}
      </DataBrowserIsolatedWrapper>

      {isAllMutationsReady && <Main mutations={mutations} props={props} />}
    </>
  );
});
