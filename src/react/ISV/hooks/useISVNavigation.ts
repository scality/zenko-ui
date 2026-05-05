import { useShellHooks } from '@scality/module-federation';
import { useMemo } from 'react';
import type { ISVCardConfig } from '../types';

export const useISVNavigation = (selectedISV: ISVCardConfig | null) => {
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

  const navigate = () => {
    const configurationView = { view: zenkoUIView, app: zenkoUI, isFederated: true as const };
    if (currentApp === 'zenko-ui') {
      window.dispatchEvent(new CustomEvent('HistoryPushEvent', { detail: { path: zenkoUIView.path } }));
    } else {
      openLink(configurationView);
    }
  };

  return { navigate };
};
