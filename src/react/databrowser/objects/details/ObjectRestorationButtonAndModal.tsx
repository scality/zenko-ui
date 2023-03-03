import { ChangeEvent, useState } from 'react';
import {
  Banner,
  Icon,
  Modal,
  PrettyBytes,
  Stack,
  Text,
  Wrap,
} from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import { useMutation } from 'react-query';
import { useSelector } from 'react-redux';
import { AWSError } from 'aws-sdk';
import { getClients } from '../../../utils/actions';
import { AppState } from '../../../../types/state';
import { formatShortDate } from '../../../utils';

type RestoreObjectType = {
  bucketName: string;
  objectKey: string;
  objectLastModifiesOn: string;
  objectSize: number;
  objectStorageClass: string;
  isObjectRestoredOrOnGoing: boolean;
  objectVersionId?: string;
};
const ObjectRestorationButtonAndModal = ({
  bucketName,
  objectKey,
  objectLastModifiesOn,
  objectSize,
  objectStorageClass,
  isObjectRestoredOrOnGoing,
  objectVersionId,
}: RestoreObjectType) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restorationDays, setRestorationDays] = useState(1);
  const [restoreError, setRestoreError] = useState('');
  const { zenkoClient } = getClients(useSelector((state: AppState) => state));
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const ObjectTable = () => {
    return (
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #323245' }}>
            <th align="left">Name</th>
            <th align="left">Modification On</th>
            <th align="left">Size</th>
            <th align="left">Storage Class</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #323245' }}>
            <td align="left">{objectKey}</td>
            <td align="left">
              {formatShortDate(new Date(objectLastModifiesOn))}
            </td>
            <td align="left">
              <PrettyBytes bytes={objectSize} decimals={1} />
            </td>
            <td align="left">{objectStorageClass || 'default'}</td>
          </tr>
        </tbody>
      </table>
    );
  };
  const RestorationModalContent = () => {
    return (
      <div style={{ maxWidth: '45rem' }}>
        {restoreError && (
          <Banner
            variant="warning"
            title="Restore Object Failed"
            icon={<Icon name="Exclamation-circle" color="statusWarning"></Icon>}
          >
            {restoreError}
          </Banner>
        )}
        <Stack direction="vertical" gap="f32">
          <Text>
            To restore an object, you need to launch a Restoration request, then
            wait for the object to become available.
          </Text>
          <ObjectTable />
          <Stack>
            Duration of Restoration
            <Input
              id="restorationDuration"
              name="restorationDuration"
              type="number"
              value={restorationDays}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setRestorationDays(parseInt(e.target.value))
              }
              size="1/3"
            ></Input>{' '}
            day(s)
          </Stack>
          <Text>
            A temporary copy of your object will be available during a limited
            number of days. After this period, the restored copy will be
            automatically deleted.
          </Text>
        </Stack>
      </div>
    );
  };

  const restore = useMutation(
    async () => {
      await zenkoClient.restoreObject(
        bucketName,
        objectKey,
        restorationDays,
        objectVersionId,
      );
    },
    {
      onSuccess: () => {
        handleClose();
      },
      onError: (err: AWSError) => {
        setRestoreError(err.message);
      },
    },
  );

  return (
    <>
      <Button
        id="restore-button"
        type="button"
        variant="outline"
        disabled={isObjectRestoredOrOnGoing || restore.isLoading}
        label="Restore"
        onClick={() => setIsModalOpen(true)}
      ></Button>
      <Modal
        close={handleClose}
        footer={
          <Wrap>
            <p></p>
            <Stack>
              <Button variant="outline" onClick={handleClose} label="Cancel" />
              <Button
                variant="primary"
                onClick={() => restore.mutate()}
                label="Start Restoration"
                disabled={restore.isLoading}
              />
            </Stack>
          </Wrap>
        }
        isOpen={isModalOpen}
        title="Restore Object?"
      >
        <RestorationModalContent />
      </Modal>
    </>
  );
};
export default ObjectRestorationButtonAndModal;
