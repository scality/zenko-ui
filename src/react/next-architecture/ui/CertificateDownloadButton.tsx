import { FederatedComponent, useShellAlerts, useShellHooks } from '@scality/module-federation';

export const CertificateDownloadButton = () => {
  const shellHooks = useShellHooks();
  const shellAlerts = useShellAlerts();
  const { useDeployedApps, useConfigRetriever } = shellHooks;
  const deployedApps = useDeployedApps();
  const artescaUI = deployedApps.find((app: { kind: string }) => app.kind === 'artesca-base-ui');
  const { retrieveConfiguration } = useConfigRetriever();

  if (artescaUI) {
    const url =
      artescaUI.url +
      retrieveConfiguration({
        configType: 'build',
        name: artescaUI.name,
      }).spec.remoteEntryPath;

    return (
      <FederatedComponent
        module={'./certificates/DownloadButton'}
        scope={'artesca'}
        url={url}
        app={artescaUI}
        props={{
          filename: 'artesca-ca.pem',
          variant: 'outline',
          shellHooks,
          shellAlerts,
        }}
      />
    );
  }

  return <></>;
};
