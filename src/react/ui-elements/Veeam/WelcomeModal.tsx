import { Icon, Modal, spacing, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useMemo, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { InternalRouter } from '../../FederableApp';

import { useAccounts, useAuthGroups } from '../../utils/hooks';
import { setSessionState } from '../../utils/localStorage';
import { ArtescaLogo } from './ArtescaLogo';

import { useNextLogin } from './useNextLogin';
import AlertProvider, {
  useAlerts,
} from '../../next-architecture/ui/AlertProvider';
import { useShellHooks } from '@scality/module-federation';
import { StyledGrid } from '../PartnerApp/ISVModal';
import { ISVList, ISVManualList } from '../PartnerApp/ISVList';
import { CardISV, ManualISVCard } from '../PartnerApp/CardISV';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
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
  const isWelcomeModalEnabled =
    isStorageManager &&
    isZeroAccountCreated &&
    !isAlreadyInConfigurationView &&
    isNextLogin &&
    !isTrialLicenseModalDisplayed;

  if (!isWelcomeModalEnabled) {
    return <></>;
  }

  return <ModalComponent />;
};

const ModalComponent = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [selectedISV, setSelectedISV] = useState<string>('');
  const { useLinkOpener, useDeployedApps, useAuth } = useShellHooks();
  const { openLink } = useLinkOpener();
  const deployedApps = useDeployedApps();
  const zenkoUI = deployedApps.find(
    (app: { kind: string }) => app.kind === 'zenko-ui',
  );

  const theme = useTheme();
  const currentApp =
    deployedApps.find(
      (app) =>
        window.location.pathname.startsWith(app.appHistoryBasePath) &&
        app.appHistoryBasePath !== '',
    )?.kind ?? deployedApps.find((app) => app.appHistoryBasePath === '')?.kind;

  const zenkoUIConfigurationView = useMemo(
    () => ({
      path: `/isv/configuration?platform=${selectedISV}`,
      label: {
        en: 'ISV Configuration',
        fr: 'Configuration ISV',
      },
      module: './FederableApp',
      scope: 'zenko',
    }),
    [selectedISV],
  );

  const configurationView = {
    view: zenkoUIConfigurationView,
    app: zenkoUI,
    isFederated: true as const,
  };

  const user = useAuth();
  const session_state = user?.userData?.original?.session_state;

  return (
    <CustomModal
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Welcome to ARTESCA</Text> <ArtescaLogo />
        </Stack>
      }
      isOpen={isOpen}
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
              disabled={!selectedISV}
              onClick={() => {
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
              }}
            />
          </Stack>
        </Wrap>
      }
    >
      <Stack direction="vertical" gap="r8">
        <Text isEmphazed variant="Large" style={{ marginBottom: spacing.r16 }}>
          Which application would you like to configure with your ARTESCA?
        </Text>
        <Text style={{ paddingLeft: spacing.r16 }}>
          Scality provides products that are certified with some of the most
          esteemed applications in the industry.
        </Text>
        <form
          style={{
            backgroundColor: theme.backgroundLevel2,
            borderRadius: spacing.f8,
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '50vh',
          }}
        >
          <Stack
            direction="vertical"
            gap="r8"
            style={{
              backgroundColor: theme.backgroundLevel2,
              padding: spacing.r16,
              borderRadius: spacing.f8,
            }}
          >
            <Text isEmphazed color="textPrimary">
              Automatic configuration via assistant
            </Text>
            <StyledGrid>
              {ISVList.map((isv) => {
                return (
                  <CardISV
                    name={isv.name}
                    logo={isv.logo}
                    application={isv.type}
                    selected={selectedISV === isv.id}
                    onChange={() => setSelectedISV(isv.id)}
                  ></CardISV>
                );
              })}
            </StyledGrid>
            <Text isEmphazed color="textPrimary">
              Manual configuration
            </Text>
            <StyledGrid>
              {ISVManualList.map((isv) => {
                return (
                  <ManualISVCard
                    logo={isv.logo}
                    application={isv.application}
                    link={isv.documentationLink}
                  ></ManualISVCard>
                );
              })}
            </StyledGrid>
          </Stack>
        </form>
      </Stack>
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
