import { Form, Icon, Stack, Text } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import Table, * as T from '../../ui-elements/Table';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useState, useMemo, useCallback, Fragment } from 'react';
import { useQueryClient } from 'react-query';
import styled, { useTheme } from 'styled-components';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ISVStepsIndexes, ISV_STEPS } from './ISVSteps';
import { memo } from 'react';
import { ISVSkipModal } from './ISVSkipModal';
import { useMutationActions } from '../hooks/useMutationActions';
import { Bucket, ISVConfig, ISVPlatformConfig } from '../types';
import { Account } from '../../next-architecture/domain/entities/account';
import { useCreateBucketByS3Client } from '../../next-architecture/domain/business/buckets';
import {
  usePutBucketTaggingMutationByS3Client,
  usePutObjectMutation,
} from '../../../js/mutations';
import { useMultiMutation, Mutation } from '../hooks/useMultiMutation';

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
}: {
  bucket: Bucket;
  onMutationReady: (key: string, mutation: Mutation) => void;
}) => {
  const createBucketMutation = useCreateBucketByS3Client();
  const putBucketTaggingMutation = usePutBucketTaggingMutationByS3Client();

  useMemo(() => {
    onMutationReady(`createBucket-${bucket.name}`, createBucketMutation);
    onMutationReady(
      `putBucketTagging-${bucket.name}`,
      putBucketTaggingMutation,
    );
  }, [createBucketMutation.status, putBucketTaggingMutation.status]);

  return <></>;
};

const BucketVeeamMutation = ({
  bucket,
  onMutationReady,
  autoCreateRepository,
}: {
  bucket: Bucket;
  onMutationReady: (key: string, mutation: Mutation) => void;
  autoCreateRepository?: boolean;
}) => {
  const putVeeamFolderMutation = usePutObjectMutation();
  const putVeeamSystemXmlMutation = usePutObjectMutation();
  const putVeeamCapacityXmlMutation = usePutObjectMutation();
  const putVeeamBackupFolderMutation = usePutObjectMutation();
  const putVeeamArchiveFolderMutation = usePutObjectMutation();

  useMemo(() => {
    onMutationReady(`putVeeamFolder-${bucket.name}`, putVeeamFolderMutation);
    onMutationReady(
      `putVeeamSystemXml-${bucket.name}`,
      putVeeamSystemXmlMutation,
    );
    onMutationReady(
      `putVeeamCapacityXml-${bucket.name}`,
      putVeeamCapacityXmlMutation,
    );

    // Add folder creation mutations when auto-repository creation is enabled
    if (autoCreateRepository) {
      onMutationReady(
        `putVeeamBackupFolder-${bucket.name}`,
        putVeeamBackupFolderMutation,
      );
      onMutationReady(
        `putVeeamArchiveFolder-${bucket.name}`,
        putVeeamArchiveFolderMutation,
      );
    }
  }, [
    putVeeamFolderMutation.status,
    putVeeamSystemXmlMutation.status,
    putVeeamCapacityXmlMutation.status,
    putVeeamBackupFolderMutation.status,
    putVeeamArchiveFolderMutation.status,
    autoCreateRepository,
  ]);

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
    autoCreateRepository,
  } = props;
  const { data, accessKey, secretKey, repositoryData } = useMutationActions(
    props,
    mutations,
  );

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
      repositoryData,
      autoCreateRepository,
    });
  }, [
    accountName,
    buckets,
    enableImmutableBackup,
    accessKey,
    secretKey,
    application,
    accessKeys,
    repositoryData,
    autoCreateRepository,
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
  const { buckets, platform, autoCreateRepository } = props;
  const isVeeamVBR = platform.id === 'veeam-vbr';
  const { mutations, handleMutationReady, isAllMutationsReady } =
    useMultiMutation(
      buckets,
      isVeeamVBR
        ? buckets.length * (autoCreateRepository ? 7 : 5) // Adjust mutation count for auto-repository
        : buckets.length * 2,
    );

  return (
    <>
      {buckets.map((bucket) => (
        <Fragment key={bucket.name}>
          <BucketMutation
            bucket={bucket}
            onMutationReady={handleMutationReady}
          />
          {isVeeamVBR && (
            <BucketVeeamMutation
              bucket={bucket}
              onMutationReady={handleMutationReady}
              autoCreateRepository={autoCreateRepository}
            />
          )}
        </Fragment>
      ))}

      {isAllMutationsReady && <Main mutations={mutations} props={props} />}
    </>
  );
});
