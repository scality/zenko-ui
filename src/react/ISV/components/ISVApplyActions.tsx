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
import { useCreateBucket } from '../../next-architecture/domain/business/buckets';
import { useCreateBucketByS3Client } from '../../next-architecture/domain/business/buckets';
import { usePutBucketTaggingMutation } from '../../../js/mutations';
import { useMultiMutation, MutationWithKey } from '../hooks/useMultiMutation';

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
  account,
  bucket,
  onMutationReady,
}: {
  account: null | Account;
  bucket: Bucket;
  onMutationReady: (key: string, mutation: MutationWithKey) => void;
}) => {
  const createBucketMutation = useCreateBucket();
  const createBucketByS3ClientMutation = useCreateBucketByS3Client();

  useMemo(() => {
    onMutationReady(
      `createBucket-${bucket.name}`,
      account
        ? { ...createBucketMutation, key: `createBucket-${bucket.name}` }
        : {
            ...createBucketByS3ClientMutation,
            key: `createBucket-${bucket.name}`,
          },
    );
  }, [createBucketMutation.status, createBucketByS3ClientMutation.status]);

  return <></>;
};

const BucketTagMutation = ({
  bucket,
  onMutationReady,
}: {
  bucket: Bucket;
  onMutationReady: (key: string, mutation: MutationWithKey) => void;
}) => {
  const putBucketTaggingMutation = usePutBucketTaggingMutation();

  useMemo(() => {
    onMutationReady(`putBucketTagging-${bucket.name}`, {
      ...putBucketTaggingMutation,
      key: `putBucketTagging-${bucket.name}`,
    });
  }, [putBucketTaggingMutation.status]);

  return <></>;
};

const Main = ({
  props,
  mutations,
}: {
  props: ISVApplyActionsProps;
  mutations: Record<string, MutationWithKey>;
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
              <T.HeadRow>
                <T.HeadCell>Step</T.HeadCell>
                <T.HeadCell>Action</T.HeadCell>
                <T.HeadCell>Status</T.HeadCell>
              </T.HeadRow>
            </T.Head>
            <T.Body>
              {data.map((row, index) => (
                <T.Row key={index} style={{ display: 'flex' }}>
                  <T.Cell>{row.step}</T.Cell>
                  <T.Cell style={{ flex: 0.5 }}>
                    <div>
                      <Text>{row.action}</Text>
                    </div>
                  </T.Cell>
                  <T.Cell>
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
  const { buckets, account } = props;
  const { mutations, handleMutationReady, isAllMutationsReady } =
    useMultiMutation(buckets, buckets.length * 2);

  return (
    <>
      {buckets.map((bucket) => (
        <Fragment key={bucket.name}>
          <BucketMutation
            account={account}
            bucket={bucket}
            onMutationReady={handleMutationReady}
          />
          <BucketTagMutation
            bucket={bucket}
            onMutationReady={handleMutationReady}
          />
        </Fragment>
      ))}

      {isAllMutationsReady && <Main mutations={mutations} props={props} />}
    </>
  );
});
