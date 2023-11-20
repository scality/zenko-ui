import { ErrorPage500 } from '@scality/core-ui';
import { createContext } from 'react';
import {
  ComponentWithFederatedImports,
  useCurrentApp,
} from '@scality/module-federation';
import { AppConfig } from '../../../types/entities';
import { ErrorBoundary } from 'react-error-boundary';

export const _ConfigContext = createContext<AppConfig | null>(null);

const configGlobal = {};
const deployedInstancesGlobal = {};
export function useConfig(): AppConfig {
  const { name } = useCurrentApp();
  return configGlobal.hooks.useConfig({
    configType: 'run',
    name,
  }).spec.selfConfiguration;
}

export function useLinkOpener() {
  return configGlobal.hooks.useLinkOpener();
}

export function useDiscoveredViews() {
  return configGlobal.hooks.useDiscoveredViews();
}

export function useDeployedApps() {
  return deployedInstancesGlobal.hooks.useDeployedApps();
}

export function useDeployedMetalk8sInstances(): SolutionUI[] {
  return deployedInstancesGlobal.hooks.useDeployedApps({
    kind: 'metalk8s-ui',
  });
}

export function useConfigRetriever() {
  return configGlobal.hooks.useConfigRetriever();
}

export function useGrafanaURL() {
  const { retrieveConfiguration } = configGlobal.hooks.useConfigRetriever();
  const instances = useDeployedMetalk8sInstances();

  if (instances.length) {
    const baseUrl = new URL(instances[0].url).origin;
    const runTimeConfig = retrieveConfiguration({
      configType: 'run',
      name: instances[0].name,
    });
    return baseUrl + runTimeConfig.spec.selfConfiguration.url_grafana;
  } else {
    console.log('There is no Metalk8s instance deployed yet.');
    return '';
  }
}

const InternalConfigProvider = ({
  moduleExports,
  children,
}: {
  moduleExports: Record<string, unknown>;
  children: React.ReactNode;
}): React.ReactNode => {
  configGlobal.hooks =
    moduleExports['./moduleFederation/ConfigurationProvider'];
  deployedInstancesGlobal.hooks =
    moduleExports['./moduleFederation/UIListProvider'];
  return <>{children}</>;
};

function ErrorFallback() {
  // const intl = useIntl();
  // const language = intl.locale;
  return <ErrorPage500 data-cy="sc-error-page500" locale={'en'} />;
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ComponentWithFederatedImports
        componentWithInjectedImports={InternalConfigProvider}
        renderOnError={<ErrorPage500 />}
        componentProps={{
          children,
        }}
        federatedImports={[
          {
            scope: 'shell',
            module: './moduleFederation/ConfigurationProvider',
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
          {
            scope: 'shell',
            module: './moduleFederation/UIListProvider',
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
        ]}
      />
    </ErrorBoundary>
  );
}
