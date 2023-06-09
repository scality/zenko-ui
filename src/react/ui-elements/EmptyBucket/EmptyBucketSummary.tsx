import { S3 } from 'aws-sdk';
import { useMemo } from 'react';
import { CustomModal as Modal, ModalBody } from '../Modal';
import { EmptyBucketSummaryFooter } from './EmptyBucketSummaryFooter';
import { EmptyBucketSummaryList } from './EmptyBucketSummaryList';
import { BUCKET_IS_TOO_HEAVY, SUMMARY } from './constants';
import { Banner, Icon } from '@scality/core-ui';

type EmptyBucketSummaryProps = {
  deleteResult: S3.DeleteObjectsOutput;
  onClose: () => void;
  open: boolean;
  isFetchNextPage: boolean;
};

const useCreateDeleteSummaryData = (deleteResult: S3.DeleteObjectsOutput) =>
  useMemo(() => {
    const deleteSummaryData = [
      {
        attempts:
          (deleteResult.Deleted?.length || 0) +
          (deleteResult.Errors?.length || 0),
        deleted: deleteResult.Deleted?.length || 0,
        errors: {
          nbErrors: deleteResult.Errors?.length || 0,
          messages: deleteResult.Errors?.map((error) =>
            error.Message ? error.Message : '',
          ),
        },
      },
    ];

    return deleteSummaryData;
  }, [deleteResult]);

export const EmptyBucketSummary = ({
  deleteResult,
  onClose,
  open,
  isFetchNextPage,
}: EmptyBucketSummaryProps) => {
  const deleteSummaryData = useCreateDeleteSummaryData(deleteResult);

  return (
    <Modal
      title={SUMMARY}
      close={onClose}
      isOpen={open}
      footer={<EmptyBucketSummaryFooter close={onClose} />}
    >
      <ModalBody>
        {isFetchNextPage ? null : (
          <Banner
            variant="danger"
            icon={<Icon name="Exclamation-circle" color="statusCritical" />}
            title="Error"
          >
            {BUCKET_IS_TOO_HEAVY}
          </Banner>
        )}
        <br />
        <EmptyBucketSummaryList summaryData={deleteSummaryData} />
      </ModalBody>
    </Modal>
  );
};
