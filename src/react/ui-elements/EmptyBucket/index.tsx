import { Banner, BasicText, Icon, Input, Tooltip } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { S3 } from 'aws-sdk';
import { isEqual } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import styled from 'styled-components';
import {
  useBucketDefaultRetention,
  useDeleteObjects,
} from '../../next-architecture/domain/business/buckets';
import { useS3Client } from '../../next-architecture/ui/S3ClientProvider';
import { getObjectsVersions } from '../../queries';
import { useAwsPaginatedEntities } from '../../utils/IAMhooks';
import { useCheckIfBucketEmpty, usePrevious } from '../../utils/hooks';
import { CustomModal as Modal } from '../Modal';
import { EmptyBucketModalFooter } from './EmptyBucketModalFooter';
import { EmptyBucketSummary } from './EmptyBucketSummary';
import {
  BUCKET_EMPTY,
  BUCKET_EMPTY_CHECKING,
  EMPTY_CONFIRMATION_MODAL_TITLE,
  INPUT_PLACEHOLDER,
  VALID_CONFIRM_INPUT,
} from './constants';
import { createDeleteObjectsData, paginateData } from './utils';

export const ModalContent = styled.div`
  max-width: 35rem;
`;
type EmptyBucketProps = {
  bucketName: string;
};

const CustomListItem = styled.li`
  padding: 0.5rem;
`;

const emptyBucketInfosList = [
  'Emptying a bucket removes all contents and cannot be reversed.',
  'New objects added during the empty action may also be removed.',
  'Adjust workflows linked to this bucket to avoid adding objects during the emptying action.',
];

const RetentionText = () => (
  <BasicText>
    If some of the objects you are trying to delete are locked in governance
    mode, confirming the deletion will effectively delete them as the governance
    retention will be bypassed.
  </BasicText>
);

const LifecycleText = () => (
  <BasicText>
    The action of emptying can erase a maximum of 20 000 objects. For buckets
    with a substantial number of objects, an expiration workflow (lifecycle
    rule) could provide an effective alternative to emptying the bucket.
  </BasicText>
);

const DEFAULT_GOVERNANCE_RETENTION = { BypassGovernanceRetention: true };
const MAX_DELETE_OBJECT_SIZE = 20_000;

export const EmptyBucket = ({ bucketName }: EmptyBucketProps) => {
  const [confirmText, setConfirmText] = useState<string>('');
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState<boolean>(false);
  const [deleteResult, setDeleteResult] = useState<S3.DeleteObjectsOutput>();
  const [enabled, setIsEnabled] = useState<boolean>(false);
  const [isFetchNextPage, setIsFetchNextPage] = useState<boolean>(true);
  const [hasCompletedDeletion, setHasCompletedDeletion] =
    useState<boolean>(false);

  const { defaultRetention } = useBucketDefaultRetention({
    bucketName,
  });
  const { isBucketEmpty, objectStatus } = useCheckIfBucketEmpty(bucketName);
  const s3Client = useS3Client();
  const queryClient = useQueryClient();

  const queryKey = ['objectVersions', bucketName];

  const handleDeleteResult = (data: S3.DeleteObjectsOutput) => {
    setDeleteResult((prev) => {
      if (prev) {
        return {
          Deleted: [
            ...(prev.Deleted ? prev.Deleted : []),
            ...(data.Deleted ? data.Deleted : []),
          ],
          Errors: [
            ...(prev.Errors ? prev.Errors : []),
            ...(data.Errors ? data.Errors : []),
          ],
        };
      }
      return data;
    });
  };
  const { mutate, isLoading, isError, error, reset } = useDeleteObjects(
    bucketName,
    handleDeleteResult,
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value },
    } = event;

    setConfirmText(value);
  };

  const handleEmptyClick = () => {
    setIsEmptyModalOpen(!isEmptyModalOpen);
  };

  const resetAllStates = useCallback(() => {
    setConfirmText('');
    setDeleteResult(undefined);
    setIsEnabled(false);
    setIsFetchNextPage(true);
    setHasCompletedDeletion(false);
    queryClient.removeQueries({ queryKey });
    reset();
  }, []);

  const cancel = () => {
    setIsEmptyModalOpen(false);
    resetAllStates();
  };

  const isConfirm = confirmText === VALID_CONFIRM_INPUT;

  // Check if Object-lock is enabled
  const isObjectLock =
    defaultRetention.status === 'success' &&
    defaultRetention.value.ObjectLockEnabled === 'Enabled';

  // Fetch object versions
  const { status, data } = useAwsPaginatedEntities(
    {
      ...getObjectsVersions({
        bucketName,
        s3Client,
        enabled,
        isInfinite: true,
      }),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
    (data) => createDeleteObjectsData(data.DeleteMarkers, data.Versions),
  );

  // Previous data for comparison
  const previousData = usePrevious(data);

  // When the token is being renewed, this component get unmounted so we have to remove the data, else post remount it will conitnue deletion despite the modal get unnounted. This is to removed once we solve the globabl reload issue on token renewal
  useEffect(() => {
    return () => {
      queryClient.removeQueries(queryKey);
    };
  }, []);

  useEffect(() => {
    if (data && !isEqual(previousData, data) && !hasCompletedDeletion) {
      mutate({
        Bucket: bucketName,
        Delete: {
          Objects: paginateData(data),
        },
        ...DEFAULT_GOVERNANCE_RETENTION,
      });
    }
  }, [data, hasCompletedDeletion]);

  // Check if the maximum delete object size has been reached
  useEffect(() => {
    if (data && data.length >= MAX_DELETE_OBJECT_SIZE) {
      queryClient.cancelQueries({ queryKey });
      setIsEnabled(false);
      setIsFetchNextPage(false);
    }
  }, [data]);

  const deleteNumber =
    (deleteResult?.Deleted?.length || 0) + (deleteResult?.Errors?.length || 0);

  useEffect(() => {
    const isCompleted = data?.length === deleteNumber;
    if (isCompleted) {
      setHasCompletedDeletion(true);
    }
  }, [data?.length, deleteResult]);

  // Remove queries when deletion is completed
  useEffect(() => {
    if (hasCompletedDeletion) {
      setIsEnabled(false);
      queryClient.removeQueries(queryKey);
    }
  }, [hasCompletedDeletion]);

  return (
    <>
      <Tooltip
        overlay={
          objectStatus === 'loading' ? BUCKET_EMPTY_CHECKING : BUCKET_EMPTY
        }
        overlayStyle={{
          width: '9rem',
          display: isBucketEmpty ? 'none' : undefined,
        }}
      >
        <Button
          icon={<Icon name="Eraser" />}
          disabled={!isBucketEmpty}
          variant="danger"
          onClick={handleEmptyClick}
          label={EMPTY_CONFIRMATION_MODAL_TITLE}
          style={{
            marginRight: '1rem',
          }}
        />
      </Tooltip>
      {hasCompletedDeletion ? (
        <EmptyBucketSummary
          deleteResult={deleteResult || {}}
          onClose={cancel}
          open={isEmptyModalOpen}
          isFetchNextPage={isFetchNextPage}
        />
      ) : (
        <Modal
          close={cancel}
          isOpen={isEmptyModalOpen}
          title={`${EMPTY_CONFIRMATION_MODAL_TITLE} '${bucketName}'?`}
          footer={
            <EmptyBucketModalFooter
              loading={
                isLoading ||
                status === 'loading' ||
                (Boolean(deleteResult) && !hasCompletedDeletion)
              }
              cancel={cancel}
              deleteNumber={deleteNumber}
              approve={() => {
                setIsEnabled(true);
              }}
              isConfirm={isConfirm}
            />
          }
        >
          <ModalContent>
            {isError && (
              <>
                <Banner
                  variant="danger"
                  icon={
                    <Icon name="Exclamation-circle" color="statusCritical" />
                  }
                  title="Error"
                >
                  {error?.message}
                </Banner>
                <br />
              </>
            )}
            {isObjectLock && (
              <>
                <Banner
                  icon={
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: spacing.sp8,
                      }}
                    >
                      <Icon
                        name="Exclamation-circle"
                        color="statusWarning"
                        size="lg"
                      />
                    </div>
                  }
                  variant="warning"
                >
                  <RetentionText />
                </Banner>
                <br />
              </>
            )}
            <ul>
              {emptyBucketInfosList.map((listInfo, i) => (
                <CustomListItem key={i}>{listInfo}</CustomListItem>
              ))}
            </ul>
            <Banner
              icon={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: spacing.sp8,
                  }}
                >
                  <Icon name="Info-circle" size="lg" />
                </div>
              }
              variant="base"
            >
              <LifecycleText />
            </Banner>
            <br />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingTop: '1rem',
              }}
            >
              <label style={{ float: 'left', marginRight: '1rem' }}>
                Type "confirm" to delete all content
              </label>
              <Input
                aria-label="confirm-input"
                autoFocus={isEmptyModalOpen}
                placeholder={INPUT_PLACEHOLDER}
                type="text"
                value={confirmText}
                onChange={handleInputChange}
              />
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
