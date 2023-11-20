import { FederatedComponent } from '@scality/module-federation';
import { useConfigRetriever, useDeployedApps } from './ConfigProvider';

export const CertificateDownloadButton = () => {
  const deployedApps = useDeployedApps();
  const artescaUI = deployedApps.find(
    (app: { kind: string }) => app.kind === 'artesca-base-ui',
  );
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
        }}
      ></FederatedComponent>
    );
  }

  return <></>;
};
