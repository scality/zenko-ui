import {
  Banner,
  Icon,
  IconHelp,
  Modal,
  spacing,
  Stack,
  Text,
  useToast,
} from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useMemo, useState } from 'react';
import { MutationOptions, useQueryClient } from 'react-query';
import { useToggleTLSVerificationMutation } from '../../js/mutations';
import { ApiError } from '../../types/actions';
import { ZenkoCR } from './Truststore';

const skipTLSVerificationTooltipMessage = (
  <Stack direction="vertical" gap="r8">
    <Text variant="Small">
      Skipping TLS Verification will allow you to access external locations
      without verifying their TLS certificates.
    </Text>
    <Text variant="Small">
      Without TLS verification, you lose the ability to:
      <ul style={{ marginLeft: spacing.r16 }}>
        <li style={{ marginBottom: spacing.r4 }}>
          verify the external location's identity
        </li>
        <li style={{ marginBottom: spacing.r4 }}>ensure non-repudiation</li>
      </ul>
      Your data remains encrypted, but the secure channel verification is
      bypassed.
    </Text>
    <Text variant="Small">
      Toggling this setting will update the Data Management Component
      configuration. This action will take some time to complete.
    </Text>
  </Stack>
);

const TLSVerificationUpdater = ({
  zenkoCR,
  isLoadingZenkoCR,
}: {
  zenkoCR: ZenkoCR;
  isLoadingZenkoCR: boolean;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTLSVerificationActive = useMemo(() => {
    return !zenkoCR?.spec?.egress?.skipTLSVerify;
  }, [zenkoCR]);

  const hasEgress = useMemo(() => {
    return !!zenkoCR?.spec?.egress;
  }, [zenkoCR]);

  const toggleTLSVerificationMutationOptions: MutationOptions<
    { skipTLSVerify: boolean },
    ApiError,
    { skipTLSVerify: boolean }
  > = {
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['zenkoCR'] });
      showToast({
        message: 'TLS verification updated successfully',
        status: 'success',
        open: true,
      });
      setIsModalOpen(false);
    },
    onError: () => {
      showToast({
        message: 'An error occurred while updating TLS verification',
        status: 'error',
        open: true,
      });
      setIsModalOpen(false);
    },
  };
  const {
    mutate: toggleTLSVerificationMutation,
    isLoading: isUpdatingTLSVerification,
  } = useToggleTLSVerificationMutation(
    hasEgress,
    toggleTLSVerificationMutationOptions,
  );
  const handleConfirm = () => {
    toggleTLSVerificationMutation({ skipTLSVerify: isTLSVerificationActive });
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <Stack direction="vertical" gap="r8">
      <Stack
        direction="horizontal"
        gap="r4"
        style={{ marginRight: spacing.r16 }}
      >
        <Text>TLS Verification</Text>
        <IconHelp tooltipMessage={skipTLSVerificationTooltipMessage} />
      </Stack>
      <Stack>
        <Text>
          {isUpdatingTLSVerification || isLoadingZenkoCR
            ? 'Updating...'
            : isTLSVerificationActive
            ? 'Active'
            : 'Skipped'}
        </Text>
        <Button
          aria-label="Open Modal"
          color="textSecondary"
          icon={<Icon name="Pencil" />}
          variant="outline"
          isLoading={isUpdatingTLSVerification || isLoadingZenkoCR}
          tooltip={{
            overlay: `${
              isTLSVerificationActive ? 'Skip' : 'Activate'
            } TLS Verification`,
          }}
          onClick={() => setIsModalOpen(!isModalOpen)}
        />
      </Stack>
      <Modal
        close={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        title={`${
          isTLSVerificationActive ? 'Skip' : 'Activate'
        } TLS Verification?`}
        footer={
          <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Stack>
              <Button
                variant="outline"
                onClick={handleCancel}
                label="Cancel"
                disabled={isUpdatingTLSVerification}
              />
              <Button
                variant="primary"
                onClick={handleConfirm}
                label={isUpdatingTLSVerification ? 'Updating...' : 'Confirm'}
                isLoading={isUpdatingTLSVerification}
              />
            </Stack>
          </Box>
        }
      >
        <Stack
          direction="vertical"
          gap="r16"
          style={{
            maxWidth: '35rem',
          }}
        >
          <Banner
            variant="warning"
            icon={<Icon color="statusWarning" name="Exclamation-circle" />}
          >
            <Text>
              Expect some delay (about 1 minute) - updating Data Management
              configuration takes time.
            </Text>
          </Banner>

          <Banner
            variant="warning"
            icon={<Icon color="statusWarning" name="Exclamation-circle" />}
          >
            {isTLSVerificationActive ? (
              <Text>
                Skipping TLS Verification will allow ARTESCA to access external
                locations without verifying their TLS certificates. This is not
                recommended as it may expose ARTESCA to security risks.
              </Text>
            ) : (
              <Text>
                Make sure to import the certificates of the external locations
                before activating TLS Verification. This will prevent service
                interruption.
              </Text>
            )}
          </Banner>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default TLSVerificationUpdater;
