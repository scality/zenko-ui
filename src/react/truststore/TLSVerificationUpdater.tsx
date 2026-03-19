import { Icon, IconHelp, Stack, spacing, Text } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useMemo, useRef, useState } from 'react';
import TLSVerificationModal from './TLSVerificationModal';
import type { ZenkoCR } from './Truststore';

const skipTLSVerificationTooltipMessage = (
  <Stack direction="vertical" gap="r8">
    <Text variant="Small">
      Skipping TLS Verification will allow you to access external locations without verifying their TLS certificates.
    </Text>
    <Text variant="Small">
      Without TLS verification, you lose the ability to:
      <ul style={{ marginLeft: spacing.r16 }}>
        <li style={{ marginBottom: spacing.r4 }}>verify the external location's identity</li>
        <li style={{ marginBottom: spacing.r4 }}>ensure non-repudiation</li>
      </ul>
      Your data remains encrypted, but the secure channel verification is bypassed.
    </Text>
    <Text variant="Small">
      Toggling this setting will update the Data Management Component configuration. This action will take some time to
      complete.
    </Text>
  </Stack>
);

const TLSVerificationUpdater = ({ zenkoCR, isLoadingZenkoCR }: { zenkoCR: ZenkoCR; isLoadingZenkoCR: boolean }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTLSVerificationActiveRef = useRef<boolean>(false);
  const isTLSVerificationActive = useMemo(() => {
    return !zenkoCR?.spec?.egress?.skipTLSVerify;
  }, [zenkoCR]);
  const hasEgress = useMemo(() => {
    return !!zenkoCR?.spec?.egress;
  }, [zenkoCR]);

  const handleOpenModal = () => {
    isTLSVerificationActiveRef.current = isTLSVerificationActive;
    setIsModalOpen(true);
  };
  return (
    <Stack direction="vertical" gap="r8">
      <Stack direction="horizontal" gap="r4" style={{ marginRight: spacing.r16 }}>
        <Text>TLS Verification</Text>
        <IconHelp tooltipMessage={skipTLSVerificationTooltipMessage} />
      </Stack>
      <Stack>
        <Text>{isLoadingZenkoCR ? 'Loading...' : isTLSVerificationActive ? 'Active' : 'Skipped'}</Text>
        <Button
          aria-label="Open Modal"
          color="textSecondary"
          icon={<Icon name="Pencil" />}
          variant="outline"
          isLoading={isLoadingZenkoCR}
          tooltip={{
            overlay: `${isTLSVerificationActive ? 'Skip' : 'Activate'} TLS Verification`,
          }}
          onClick={handleOpenModal}
        />
      </Stack>
      <TLSVerificationModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        isTLSVerificationActive={isTLSVerificationActiveRef.current}
        hasEgress={hasEgress}
      />
    </Stack>
  );
};

export default TLSVerificationUpdater;
