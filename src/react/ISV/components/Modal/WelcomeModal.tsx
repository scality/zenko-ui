import { Banner, Icon, Link, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { ShellHooksProvider, useShellHooks } from '@scality/module-federation';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import type { ShellAlerts, ShellHooks } from 'shell/compiled-types/src/hooks/useShellHooks';
import styled from 'styled-components';
import AlertProvider, { useAlerts } from '../../../next-architecture/ui/AlertProvider';
import { useAccounts, useAuthGroups } from '../../../utils/hooks';
import { setSessionState } from '../../../utils/localStorage';
import { useIsVeeamVBROnly } from '../../hooks/useIsVeeamVBROnly';
import { useNextLogin } from '../../hooks/useNextLogin';
import { ISVList } from '../../ISVList';
import { VeeamVBRPlatform } from '../../platforms/veeam-vbr';
import type { ISVCardConfig } from '../../types';
import { ArtescaLogo } from '../ArtescaLogo';
import { ArtescaPlusLogo } from '../ArtescaPLusLogo';
import { ISVModalContent } from './ISVModal';
import VeeamLogo from './Logos/VeeamLogo';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};

  > div {
    max-width: 60vw;
    width: 60vw;
  }
`;

const SmallModal = styled(Modal)`
  > div {
    max-width: 40vw;
    width: 40vw;
  }
`;

const TRIAL_LICENSE = 'TrialLicense';
type NavbarUpdaterComponentProps = {
  isFirstTimeLogin: boolean;
  shellHooks: ShellHooks;
  shellAlerts: ShellAlerts;
};

export const WelcomeModalInternal = (props: Omit<NavbarUpdaterComponentProps, 'shellHooks' | 'shellAlerts'>) => {
  const { isStorageManager, isPlatformAdmin } = useAuthGroups();
  const { accounts, status } = useAccounts();
  const { alerts } = useAlerts({
    alertname: TRIAL_LICENSE,
  });
  const { isNextLogin } = useNextLogin();
  const location = useLocation();
  const isVeeamVBROnly = useIsVeeamVBROnly();

  const isZeroAccountCreated = status === 'success' && accounts.length === 0;
  const isAlreadyInConfigurationView = location.pathname.endsWith('/configuration');
  const isTrialLicenseModalDisplayed = alerts?.length > 0 && props.isFirstTimeLogin && isPlatformAdmin;
  /*
   We display the  welcome modal only if the following conditions are met:

   1. No account exists in the platform
   2. Storage Manager is logged in
   3. Not already in the ISV config
   4. The user skip it until the next login or login for the first time
   5. No trial license modal displays
   */
  const isWelcomeModalEnabled =
    isStorageManager &&
    isZeroAccountCreated &&
    !isAlreadyInConfigurationView &&
    isNextLogin &&
    !isTrialLicenseModalDisplayed;

  if (!isWelcomeModalEnabled) {
    return <></>;
  }

  return isVeeamVBROnly ? <VeeamOnlyModalComponent /> : <ModalComponent />;
};

const useWelcomeModal = (defaultISV?: ISVCardConfig) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [selectedISV, setSelectedISV] = useState<ISVCardConfig>(defaultISV);
  const { useLinkOpener, useDeployedApps, useAuth } = useShellHooks();
  const { openLink } = useLinkOpener();
  const deployedApps = useDeployedApps();
  const zenkoUI = deployedApps.find((app: { kind: string }) => app.kind === 'zenko-ui');

  const currentApp =
    deployedApps.find(
      (app) => window.location.pathname.startsWith(app.appHistoryBasePath) && app.appHistoryBasePath !== '',
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

  const handleContinueClick = () => {
    setIsOpen(false);
    // If we are already in zenko-ui context, we can't use the openLink function.
    // That's why we have to create a custom event, and listen to it to change the route.

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

  const user = useAuth();
  const session_state = user?.userData?.original?.session_state;
  const handleSkipClick = () => {
    setIsOpen(false);
    setSessionState(session_state);
  };

  return {
    isOpen,
    setIsOpen,
    selectedISV,
    setSelectedISV,
    handleContinueClick,
    handleSkipClick,
  };
};

const VeeamOnlyModalComponent = () => {
  const veeamISV = ISVList.find((isv) => isv.id === VeeamVBRPlatform.id);
  const { isOpen, handleContinueClick, handleSkipClick } = useWelcomeModal(veeamISV);
  return (
    <SmallModal
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Welcome to</Text>
          <ArtescaPlusLogo />
        </Stack>
      }
      isOpen={isOpen}
      footer={
        <Wrap>
          <p></p>

          <Stack>
            <Button variant="outline" label="Skip" onClick={handleSkipClick} />
            <Button
              variant="primary"
              icon={<Icon name="Arrow-right"></Icon>}
              type="button"
              onClick={handleContinueClick}
              label="Continue to assistant"
            />
          </Stack>
        </Wrap>
      }
    >
      <Text>This appliance is ready to help you back up your data with:</Text>
      <Stack direction="horizontal" gap="r8">
        <VeeamLogo />
        <Text isEmphazed>Backup & Replication</Text>
      </Stack>
      <br />
      <br />
      <Banner variant="base" icon={<Icon name="Info-circle"></Icon>}>
        <Text>
          <Text>
            Start with the Veeam Assistant – a guided setup that creates the resources needed to configure ARTESCA for
            Veeam. For more details, you can follow the
          </Text>{' '}
          <Link href={veeamISV.documentationLink} target="_blank">
            documentation <Icon name="External-link"></Icon>
          </Link>
        </Text>
      </Banner>
      <br />
      <Text color="textSecondary" variant="Smaller">
        If you skip now but want to start the assistant again, you can launch it from the Accounts page or the Data
        Browser page.
        <br /> If the platform doesn't have any accounts, it will also prompt you on your next login.{' '}
      </Text>
    </SmallModal>
  );
};

const ModalComponent = () => {
  const { isOpen, selectedISV, setSelectedISV, handleContinueClick, handleSkipClick } = useWelcomeModal();

  return (
    <CustomModal
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Welcome to</Text>
          <ArtescaLogo />
          <Text variant="Large">ARTESCA - Connector Marketplace</Text>
        </Stack>
      }
      isOpen={isOpen}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button variant="outline" label={'Skip'} onClick={handleSkipClick} />
            <Button
              variant="primary"
              icon={<Icon name="Arrow-right" />}
              label={
                selectedISV ? (selectedISV?.assistant ? 'Continue to assistant' : 'Continue to account') : 'Continue'
              }
              disabled={!selectedISV}
              onClick={handleContinueClick}
            />
          </Stack>
        </Wrap>
      }
    >
      <ISVModalContent selectedISV={selectedISV} setSelectedISV={setSelectedISV}></ISVModalContent>
    </CustomModal>
  );
};

export default function WelcomeModal(props: NavbarUpdaterComponentProps) {
  return (
    <ShellHooksProvider shellHooks={props.shellHooks} shellAlerts={props.shellAlerts}>
      <AlertProvider>
        <WelcomeModalInternal {...props} />
      </AlertProvider>
    </ShellHooksProvider>
  );
}
