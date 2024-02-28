import { Icon, Loader, Stack, Tooltip, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { CustomModal as Modal } from '../Modal';
import { useDeleteBucket } from '../../next-architecture/domain/business/buckets';
import { useState } from 'react';
import { useCheckIfBucketEmpty } from '../../utils/hooks';

type DeleteBucketProps = {
  bucketName: string;
};

export const DeleteBucket = ({ bucketName }: DeleteBucketProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const { isBucketEmpty, objectStatus } = useCheckIfBucketEmpty(bucketName);
  const { mutate: deleteBucket, isLoading } = useDeleteBucket();

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const approve = () => {
    deleteBucket(
      { Bucket: bucketName },
      {
        onSuccess: () => {
          handleDeleteClick();
        },
      },
    );
  };

  return (
    <>
      <Tooltip
        overlay={
          objectStatus === 'loading'
            ? 'Checking bucket...'
            : 'Bucket is not empty'
        }
        overlayStyle={{
          width: '9rem',
          display: isBucketEmpty ? undefined : 'none',
        }}
      >
        <Button
          icon={<Icon name="Delete" />}
          disabled={isBucketEmpty}
          variant="danger"
          onClick={handleDeleteClick}
          label="Delete Bucket"
        />
      </Tooltip>
      <Modal
        close={handleDeleteClick}
        isOpen={isDeleteModalOpen}
        footer={
          <Wrap>
            <p></p>
            <Stack>
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                label="Cancel"
              />
              <Button
                disabled={isLoading}
                className="delete-confirmation-delete-button"
                variant="danger"
                onClick={approve}
                icon={isLoading && <Loader size="larger" />}
                label="Delete"
              />
            </Stack>
          </Wrap>
        }
        title="Confirmation"
      >
        {`Are you sure you want to delete bucket: ${bucketName} ?`}
      </Modal>
    </>
  );
};
