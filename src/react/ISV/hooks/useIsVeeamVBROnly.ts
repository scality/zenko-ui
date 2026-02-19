import { useShellHooks } from '@scality/module-federation';

export const useIsVeeamVBROnly = () => {
  const shellHooks = useShellHooks();
  const { useDeployedApps, useConfigRetriever } = shellHooks;
  const deployedApps = useDeployedApps();

  const artescaUI = deployedApps.find((app: { kind: string }) => app.kind === 'artesca-base-ui');
  const { retrieveConfiguration } = useConfigRetriever();

  if (artescaUI) {
    const artescaUIConfig = retrieveConfiguration({
      configType: 'run',
      name: artescaUI.name,
    });

    return (artescaUIConfig.spec?.selfConfiguration.flags || []).includes('artesca_plus_veeam');
  }

  return false;
};
