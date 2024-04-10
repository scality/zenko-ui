import { ChangeEvent, useState } from 'react';
import {
  Banner,
  FormattedDateTime,
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
import { useTheme } from 'styled-components';
import { ObjectMetadata } from '../../../../types/s3';

type RestoreObjectType = {
  bucketName: string;
  objectMetadata: ObjectMetadata;
};
const ObjectRestorationButtonAndModal = ({
  bucketName,
  objectMetadata,
}: RestoreObjectType) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restorationDays, setRestorationDays] = useState(1);
  const [restoreError, setRestoreError] = useState('');
  const { zenkoClient } = getClients(useSelector((state: AppState) => state));
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const ObjectTable = () => {
    const theme = useTheme();
    return (
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
            <th align="left">Name</th>
            <th align="left">Last Modified On</th>
            <th align="left">Size</th>
            <th align="left">Storage Class</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
            <td align="left">{objectMetadata.objectKey}</td>
            <td align="left">
              <FormattedDateTime
                value={new Date(objectMetadata.lastModified)}
                format="date-time-second"
              />
            </td>
            <td align="left">
              <PrettyBytes bytes={objectMetadata.contentLength} decimals={2} />
            </td>
            <td align="left">{objectMetadata.storageClass || 'default'}</td>
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
              min={1}
            ></Input>{' '}
            day{restorationDays >= 2 ? 's' : ''}
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
        objectMetadata.objectKey,
        restorationDays,
        objectMetadata.versionId,
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

  const isObjectRestoredOrOnGoing =
    objectMetadata.restore?.ongoingRequest ||
    !!objectMetadata.restore?.expiryDate;

  return (
    <>
      <Button
        id="restore-button"
        type="button"
        variant="outline"
        disabled={isObjectRestoredOrOnGoing || restore.isLoading}
        label="Restore"
        icon={<Icon name="Redo" />}
        onClick={() => setIsModalOpen(true)}
        tooltip={
          isObjectRestoredOrOnGoing
            ? {
                overlay:
                  'The button is disabled because the object is already restored or the restoration is ongoing',
              }
            : restore.isLoading
            ? {
                overlay:
                  'The button is disabled because the restoration request has just been triggered',
              }
            : undefined
        }
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
                tooltip={
                  restore.isLoading
                    ? {
                        overlay:
                          'The button is disabled because the restoration request has just been triggered',
                      }
                    : undefined
                }
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
