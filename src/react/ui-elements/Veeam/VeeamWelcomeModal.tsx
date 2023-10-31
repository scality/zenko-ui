import { useState } from 'react';
import { Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import {
  ConfigProvider,
  useConfig,
  useDeployedApps,
  useLinkOpener,
} from '../../next-architecture/ui/ConfigProvider';
import { VeeamLogo } from './VeeamLogo';
import { ArtescaLogo } from './ArtescaLogo';
import styled from 'styled-components';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
`;

export const VeeamWelcomeModalInternal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { features } = useConfig();
  if (!features.includes('Veeam')) {
    return <></>;
  }

  const { openLink } = useLinkOpener();
  const deployedApps = useDeployedApps();
  const zenkoUI = deployedApps.find((app) => app.kind === 'zenko-ui');
  const zenkoUIVeeamConfigurationView = {
    path: '/veeam/configuration',
    label: {
      en: 'Veeam Configuration',
      fr: 'Configuration Veeam',
    },
    module: './FederableApp',
    scope: 'zenko',
  };
  const veeamConfigurationView = {
    view: zenkoUIVeeamConfigurationView,
    app: zenkoUI,
    isFederated: true,
  };

  return (
    <CustomModal
      isOpen={isOpen}
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Welcome to ARTESCA</Text> <ArtescaLogo />
        </Stack>
      }
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button
              variant="outline"
              label={'Skip'}
              onClick={() => {
                setIsOpen(false);
              }}
            />
            <Button
              variant="primary"
              icon={<Icon name="Arrow-right" />}
              label={'Continue'}
              onClick={() => {
                setIsOpen(false);
                openLink(veeamConfigurationView);
              }}
            />
          </Stack>
        </Wrap>
      }
    >
      <Text variant="Basic">
        Get started with <br />
        ARTESCA HW Appliance for
      </Text>{' '}
      <VeeamLogo />
    </CustomModal>
  );
};

export default function VeeamWelcomeModal() {
  return (
    <ConfigProvider>
      <VeeamWelcomeModalInternal />
    </ConfigProvider>
  );
}
