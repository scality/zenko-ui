import { Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useState } from 'react';
import styled from 'styled-components';
import { VEEAM_FEATURE } from '../../../js/config';
import { InternalRouter } from '../../FederableApp';
import { useAuth } from '../../next-architecture/ui/AuthProvider';
import {
  useConfig,
  useDeployedApps,
  useLinkOpener,
} from '../../next-architecture/ui/ConfigProvider';
import { useAccounts, useAuthGroups } from '../../utils/hooks';
import { setSessionState } from '../../utils/localStorage';
import { ArtescaLogo } from './ArtescaLogo';
import { VeeamLogo } from './VeeamLogo';
import { useNextLogin } from './useNextLogin';
import AlertProvider, {
  useAlerts,
} from '../../next-architecture/ui/AlertProvider';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
`;
const TRIAL_LICENSE = 'TrialLicense';
type NavbarUpdaterComponentProps = {
  isFirstTimeLogin: boolean;
};
export const VeeamWelcomeModalInternal = (
  props: NavbarUpdaterComponentProps,
) => {
  const { features } = useConfig();
  const { isStorageManager, isPlatformAdmin } = useAuthGroups();
  const { accounts, status } = useAccounts();
  const { alerts } = useAlerts({
    alertname: TRIAL_LICENSE,
  });
  const isZeroAccountCreated = status === 'success' && accounts.length === 0;
  const isAlreadyInVeeamConfigurationView = window.location.pathname.endsWith(
    '/veeam/configuration',
  );
  const { isNextLogin } = useNextLogin();
  const isTrialLicenseModalDisplayed =
    alerts?.length > 0 && props.isFirstTimeLogin && isPlatformAdmin;
  /*
   We display the Veeam welcome modal only if the following conditions are met:
   1. Veeam feature flag is enabled
   2. No account exists in the platform
   3. Storage Manager is logged in
   4. Not already in the Veeam configuration view
   5. The user skip it until the next login or login for the first time
   6. No trial license modal displays
   */
  const isVeeamWelcomeModalEnabled =
    features.includes(VEEAM_FEATURE) &&
    isStorageManager &&
    isZeroAccountCreated &&
    !isAlreadyInVeeamConfigurationView &&
    isNextLogin &&
    !isTrialLicenseModalDisplayed;

  if (!isVeeamWelcomeModalEnabled) {
    return <></>;
  }

  return <VeeamModalComponent />;
};

const VeeamModalComponent = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { openLink } = useLinkOpener();
  const deployedApps = useDeployedApps();
  const zenkoUI = deployedApps.find(
    (app: { kind: string }) => app.kind === 'zenko-ui',
  );
  const currentApp =
    deployedApps.find(
      (app) =>
        window.location.pathname.startsWith(app.appHistoryBasePath) &&
        app.appHistoryBasePath !== '',
    )?.kind ?? deployedApps.find((app) => app.appHistoryBasePath === '')?.kind;

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

  const user = useAuth();
  const session_state = user?.userData?.original?.session_state;

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
              label={'Skip until next login'}
              onClick={() => {
                setIsOpen(false);
                setSessionState(session_state);
              }}
            />
            <Button
              variant="primary"
              icon={<Icon name="Arrow-right" />}
              label="Continue"
              onClick={() => {
                setIsOpen(false);
                // If we are already in zenko-ui context, we can't use the openLink function.
                // That's why we have to create a custom event, and listen to it to change the route.
                if (currentApp === 'zenko-ui') {
                  const event = new CustomEvent('HistoryPushEvent', {
                    detail: {
                      path: veeamConfigurationView.view.path,
                    },
                  });
                  window.dispatchEvent(event);
                } else {
                  openLink(veeamConfigurationView);
                }
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

export default function VeeamWelcomeModal(props: NavbarUpdaterComponentProps) {
  return (
    <InternalRouter>
      <AlertProvider>
        <VeeamWelcomeModalInternal {...props} />
      </AlertProvider>
    </InternalRouter>
  );
}
