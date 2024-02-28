import { ErrorPage500 } from '@scality/core-ui/dist/components/error-pages/ErrorPage500.component';
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
  //@ts-expect-error fix this when you are working on it
  return configGlobal.hooks.useConfig({
    configType: 'run',
    name,
  }).spec.selfConfiguration;
}

export function useLinkOpener() {
  //@ts-expect-error fix this when you are working on it
  return configGlobal.hooks.useLinkOpener();
}

export function useDiscoveredViews() {
  //@ts-expect-error fix this when you are working on it
  return configGlobal.hooks.useDiscoveredViews();
}

export function useDeployedApps() {
  //@ts-expect-error fix this when you are working on it
  return deployedInstancesGlobal.hooks.useDeployedApps();
}

export function useDeployedMetalk8sInstances() {
  //@ts-expect-error fix this when you are working on it
  return deployedInstancesGlobal.hooks.useDeployedApps({
    kind: 'metalk8s-ui',
  });
}

export function useDeployedXcoreInstances() {
  //@ts-expect-error fix this when you are working on it
  return deployedInstancesGlobal.hooks.useDeployedApps({
    kind: 'xcore-ui',
  });
}

export function useXcoreConfig(configType: 'run' | 'build' = 'build') {
  //@ts-expect-error fix this when you are working on it
  const { retrieveConfiguration } = configGlobal.hooks.useConfigRetriever();
  const instances = useDeployedXcoreInstances();

  if (instances.length) {
    return retrieveConfiguration({
      configType,
      name: instances[0].name,
    });
  } else {
    console.log('There is no Xcore instance deployed yet.');
  }
}

export function useConfigRetriever() {
  //@ts-expect-error fix this when you are working on it
  return configGlobal.hooks.useConfigRetriever();
}

export function useGrafanaURL() {
  //@ts-expect-error fix this when you are working on it
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
  //@ts-expect-error fix this when you are working on it
  configGlobal.hooks =
    moduleExports['./moduleFederation/ConfigurationProvider'];
  //@ts-expect-error fix this when you are working on it
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
            //@ts-expect-error fix this when you are working on it
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
          {
            scope: 'shell',
            module: './moduleFederation/UIListProvider',
            //@ts-expect-error fix this when you are working on it
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
        ]}
      />
    </ErrorBoundary>
  );
}
