import { Icon, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { ShellHooksProvider } from '@scality/module-federation';
import { useState } from 'react';
import type { ShellAlerts, ShellHooks } from 'shell/compiled-types/src/hooks/useShellHooks';
import { useISVNavigation } from '../../hooks/useISVNavigation';
import type { ISVCardConfig } from '../../types';
import { ArtescaLogo } from '../ArtescaLogo';
import { ISVWideModal } from '../shared/StyledComponents';
import { ISVModalContent } from './ISVModal';

type ISVConnectorModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  shellHooks: ShellHooks;
  shellAlerts: ShellAlerts;
};

const ISVConnectorModalInternal = ({
  isOpen,
  setIsOpen,
}: Pick<ISVConnectorModalProps, 'isOpen' | 'setIsOpen'>) => {
  const [selectedISV, setSelectedISV] = useState<ISVCardConfig>(null);
  const { navigate } = useISVNavigation(selectedISV);

  const handleContinueClick = () => {
    setIsOpen(false);
    navigate();
  };

  return (
    <ISVWideModal
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Select an ISV</Text> <ArtescaLogo />
        </Stack>
      }
      isOpen={isOpen}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button variant="outline" label="Skip" onClick={() => setIsOpen(false)} style={{ width: '80px' }} />
            <Button
              disabled={!selectedISV}
              variant="primary"
              label={selectedISV ? (selectedISV.assistant ? 'Continue to assistant' : 'Continue to account') : 'Continue'}
              icon={<Icon name="Arrow-right" />}
              onClick={handleContinueClick}
            />
          </Stack>
        </Wrap>
      }
    >
      <ISVModalContent selectedISV={selectedISV} setSelectedISV={setSelectedISV} />
    </ISVWideModal>
  );
};

export default function ISVConnectorModal({ shellHooks, shellAlerts, ...rest }: ISVConnectorModalProps) {
  return (
    <ShellHooksProvider shellHooks={shellHooks} shellAlerts={shellAlerts}>
      <ISVConnectorModalInternal {...rest} />
    </ShellHooksProvider>
  );
}
