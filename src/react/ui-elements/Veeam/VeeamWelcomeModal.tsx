import { Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useState } from 'react';
import styled from 'styled-components';
import { VEEAM_FEATURE } from '../../../js/config';
import {
  ConfigProvider,
  useConfig,
  useDeployedApps,
  useLinkOpener,
} from '../../next-architecture/ui/ConfigProvider';
import { ArtescaLogo } from './ArtescaLogo';
import { VeeamLogo } from './VeeamLogo';
import { useAccounts, useAuthGroups } from '../../utils/hooks';
import { VEEAM_DEFAULT_ACCOUNT_NAME } from './VeeamConstants';
import {
  getSkipVeeamAssistant,
  setSkipVeeamAssistant,
} from '../../utils/localStorage';
import { AuthProvider } from '../../next-architecture/ui/AuthProvider';
import { InternalRouter } from '../../FederableApp';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
`;

export const VeeamWelcomeModalInternal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { features } = useConfig();
  const { isStorageManager } = useAuthGroups();
  const { accounts } = useAccounts();
  const isVeemAccountCreated = accounts.some(
    (account) => account.Name === VEEAM_DEFAULT_ACCOUNT_NAME,
  );
  const isVeeamAssistantSkipped = getSkipVeeamAssistant();

  /*
   We display the Veeam welcome modal only if the following conditions are met:
   1. Veeam feature flag is enabled
   2. No Veeam account is created
   3. Storage Manager is logged in
   4. Have never click on the skip button
   */
  const isVeeamWelcomeModalEnabled =
    features.includes(VEEAM_FEATURE) &&
    isStorageManager &&
    !isVeemAccountCreated &&
    !isVeeamAssistantSkipped;

  if (!isVeeamWelcomeModalEnabled) {
    return <></>;
  }

  const { openLink } = useLinkOpener();
  const deployedApps = useDeployedApps();
  const zenkoUI = deployedApps.find(
    (app: { kind: string }) => app.kind === 'zenko-ui',
  );
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
                setSkipVeeamAssistant();
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
      <Stack gap={'r1'}>
        <Text variant="Basic">Get started with ARTESCA Appliance for</Text>
        <VeeamLogo />
      </Stack>
    </CustomModal>
  );
};

export default function VeeamWelcomeModal() {
  return (
    <ConfigProvider>
      <InternalRouter>
        <AuthProvider>
          <VeeamWelcomeModalInternal />
        </AuthProvider>
      </InternalRouter>
    </ConfigProvider>
  );
}
