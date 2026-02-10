import { Banner, Checkbox, Icon, Modal, Stack, Text, useToast } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/components/box/Box';
import { Button } from '@scality/core-ui/dist/next';
import { useState } from 'react';
import { type MutationOptions, useQueryClient } from 'react-query';
import { useToggleTLSVerificationMutation } from '../../js/mutations';
import type { ApiError } from '../../types/actions';

type TLSVerificationModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isTLSVerificationActive: boolean;
  hasEgress: boolean;
};

const TLSVerificationModal = ({ isOpen, setIsOpen, isTLSVerificationActive, hasEgress }: TLSVerificationModalProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const handleCloseModal = () => {
    setIsOpen(false);
    setIsConfirmed(false);
  };

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
      handleCloseModal();
    },
    onError: () => {
      showToast({
        message: 'An error occurred while updating TLS verification',
        status: 'error',
        open: true,
      });
      handleCloseModal();
    },
  };
  const { mutate: toggleTLSVerificationMutation, isLoading: isUpdatingTLSVerification } =
    useToggleTLSVerificationMutation(hasEgress, toggleTLSVerificationMutationOptions);
  return (
    <Modal
      close={handleCloseModal}
      isOpen={isOpen}
      title={`${isTLSVerificationActive ? 'Skip' : 'Activate'} TLS Verification?`}
      footer={
        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Stack>
            <Button variant="outline" onClick={handleCloseModal} label="Cancel" disabled={isUpdatingTLSVerification} />
            <Button
              variant="primary"
              disabled={!isConfirmed && !isTLSVerificationActive}
              onClick={() =>
                toggleTLSVerificationMutation({
                  skipTLSVerify: isTLSVerificationActive,
                })
              }
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
        <Text>Expect some delay (about 1 minute) - updating Data Management configuration takes time.</Text>

        <Banner variant="warning" icon={<Icon color="statusWarning" name="Exclamation-circle" />}>
          {isTLSVerificationActive ? (
            <Text>
              Skipping TLS Verification will allow ARTESCA to access external locations without verifying their TLS
              certificates. This is not recommended as it may expose ARTESCA to security risks.
            </Text>
          ) : (
            <Text>
              Make sure to import the certificates of the external locations before activating TLS Verification. This
              will prevent service interruption.
            </Text>
          )}
        </Banner>
        {!isTLSVerificationActive && (
          <Checkbox
            label="I understand the consequences of activating TLS Verification"
            onChange={() => setIsConfirmed(!isConfirmed)}
            checked={isConfirmed}
          />
        )}
      </Stack>
    </Modal>
  );
};

export default TLSVerificationModal;
