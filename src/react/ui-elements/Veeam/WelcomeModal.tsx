import { Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { InternalRouter } from '../../FederableApp';

import { useAccounts, useAuthGroups } from '../../utils/hooks';
import { setSessionState } from '../../utils/localStorage';
import { ArtescaLogo } from './ArtescaLogo';

import { useNextLogin } from './useNextLogin';
import AlertProvider, {
  useAlerts,
} from '../../next-architecture/ui/AlertProvider';
import { useShellHooks } from '@scality/module-federation';
import { ISVModalContent } from '../PartnerApp/ISVModal';
import { ISVConfig } from '../PartnerApp/ISVList';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};

  > div {
    max-width: 60vw;
    width: 60vw;
  }
`;
const TRIAL_LICENSE = 'TrialLicense';
type NavbarUpdaterComponentProps = {
  isFirstTimeLogin: boolean;
};

export const WelcomeModalInternal = (props: NavbarUpdaterComponentProps) => {
  const { isStorageManager, isPlatformAdmin } = useAuthGroups();
  const { accounts, status } = useAccounts();
  const { alerts } = useAlerts({
    alertname: TRIAL_LICENSE,
  });
  const isZeroAccountCreated = status === 'success' && accounts.length === 0;
  const isAlreadyInConfigurationView =
    window.location.pathname.endsWith('/configuration');
  const { isNextLogin } = useNextLogin();
  const isTrialLicenseModalDisplayed =
    alerts?.length > 0 && props.isFirstTimeLogin && isPlatformAdmin;
  /*
   We display the  welcome modal only if the following conditions are met:

   1. No account exists in the platform
   2. Storage Manager is logged in
   3. Not already in the ISV config
   4. The user skip it until the next login or login for the first time
   5. No trial license modal displays
   */
  // const isWelcomeModalEnabled =
  //   isStorageManager &&
  //   isZeroAccountCreated &&
  //   !isAlreadyInConfigurationView &&
  //   isNextLogin &&
  //   !isTrialLicenseModalDisplayed;

  // if (!isWelcomeModalEnabled) {
  //   return <></>;
  // }

  return <ModalComponent />;
};

const ModalComponent = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [selectedISV, setSelectedISV] = useState<ISVConfig>(null);
  const { useLinkOpener, useDeployedApps, useAuth } = useShellHooks();
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

  const zenkoUIConfigurationView = useMemo(() => {
    const view = selectedISV?.assistant
      ? {
          path: `/isv/configuration?platform=${selectedISV.id}`,
          label: {
            en: 'ISV Configuration',
            fr: 'Configuration ISV',
          },
          module: './FederableApp',
          scope: 'zenko',
        }
      : {
          path: `/accounts`,
          label: {
            en: 'Accounts',
            fr: 'Comptes',
          },
          module: './FederableApp',
          scope: 'zenko',
        };
    return view;
  }, [selectedISV]);

  const configurationView = {
    view: zenkoUIConfigurationView,
    app: zenkoUI,
    isFederated: true as const,
  };

  const user = useAuth();
  const session_state = user?.userData?.original?.session_state;

  const handleContinueClick = () => {
    setIsOpen(false);
    // If we are already in zenko-ui context, we can't use the openLink function.
    // That's why we have to create a custom event, and listen to it to change the route.

    window.open(selectedISV.documentationLink, '_blank', 'noopener');

    if (currentApp === 'zenko-ui') {
      const event = new CustomEvent('HistoryPushEvent', {
        detail: {
          path: configurationView.view.path,
        },
      });
      window.dispatchEvent(event);
    } else {
      openLink(configurationView);
    }
  };

  return (
    <CustomModal
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Welcome to</Text>
          <ArtescaLogo />
          <Text variant="Large">ARTESCA - Connector Marketplace</Text>
          <Text variant="Large" color="textSecondary">
            Draft Concept
          </Text>
        </Stack>
      }
      isOpen={isOpen}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button
              variant="outline"
              label={'Skip'}
              onClick={() => {
                setIsOpen(false);
                setSessionState(session_state);
              }}
            />
            <Button
              variant="primary"
              icon={<Icon name="Arrow-right" />}
              label={
                selectedISV
                  ? selectedISV?.assistant
                    ? 'Continue to assistant'
                    : 'Continue to account'
                  : 'Continue'
              }
              disabled={!selectedISV}
              onClick={handleContinueClick}
            />
          </Stack>
        </Wrap>
      }
    >
      <ISVModalContent
        selectedISV={selectedISV}
        setSelectedISV={setSelectedISV}
      ></ISVModalContent>
    </CustomModal>
  );
};

export default function WelcomeModal(props: NavbarUpdaterComponentProps) {
  return (
    <InternalRouter>
      <AlertProvider>
        <WelcomeModalInternal {...props} />
      </AlertProvider>
    </InternalRouter>
  );
}
