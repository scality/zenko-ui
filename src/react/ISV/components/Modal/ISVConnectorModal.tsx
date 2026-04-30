import { Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { ShellHooksProvider, useShellHooks } from '@scality/module-federation';
import { useMemo, useState } from 'react';
import type { ShellAlerts, ShellHooks } from 'shell/compiled-types/src/hooks/useShellHooks';
import styled from 'styled-components';
import type { ISVCardConfig } from '../../types';
import { ArtescaLogo } from '../ArtescaLogo';
import { ISVModalContent } from './ISVModal';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
  > div {
    max-width: 60vw;
    width: 60vw;
  }
`;

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
  const { useLinkOpener, useDeployedApps } = useShellHooks();
  const { openLink } = useLinkOpener();
  const deployedApps = useDeployedApps();
  const zenkoUI = deployedApps.find((app: { kind: string }) => app.kind === 'zenko-ui');

  const currentApp =
    deployedApps.find(
      (app) => window.location.pathname.startsWith(app.appHistoryBasePath) && app.appHistoryBasePath !== '',
    )?.kind ?? deployedApps.find((app) => app.appHistoryBasePath === '')?.kind;

  const zenkoUIView = useMemo(
    () =>
      selectedISV?.assistant
        ? {
          path: `/isv/configuration?platform=${selectedISV.id}`,
          label: { en: 'ISV Configuration', fr: 'Configuration ISV' },
          module: './FederableApp',
          scope: 'zenko',
        }
        : {
          path: `/accounts`,
          label: { en: 'Accounts', fr: 'Comptes' },
          module: './FederableApp',
          scope: 'zenko',
        },
    [selectedISV],
  );

  const handleContinueClick = () => {
    setIsOpen(false);
    const configurationView = { view: zenkoUIView, app: zenkoUI, isFederated: true as const };

    if (currentApp === 'zenko-ui') {
      window.dispatchEvent(new CustomEvent('HistoryPushEvent', { detail: { path: zenkoUIView.path } }));
    } else {
      openLink(configurationView);
    }
  };

  return (
    <CustomModal
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
    </CustomModal>
  );
};

export default function ISVConnectorModal({ shellHooks, shellAlerts, ...rest }: ISVConnectorModalProps) {
  return (
    <ShellHooksProvider shellHooks={shellHooks} shellAlerts={shellAlerts}>
      <ISVConnectorModalInternal {...rest} />
    </ShellHooksProvider>
  );
}
