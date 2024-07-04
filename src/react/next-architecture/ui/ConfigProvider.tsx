import { useCurrentApp } from '@scality/module-federation';
import { createContext } from 'react';
import { AppConfig } from '../../../types/entities';

export const _ConfigContext = createContext<AppConfig | null>(null);

export function useConfig(): AppConfig {
  const { name } = useCurrentApp();
  return window.shellHooks.useConfig<AppConfig>({
    configType: 'run',
    name,
  }).spec.selfConfiguration;
}

export function useLinkOpener() {
  return window.shellHooks.useLinkOpener();
}

export function useDiscoveredViews() {
  return window.shellHooks.useDiscoveredViews();
}

export function useDeployedApps() {
  return window.shellHooks.useDeployedApps();
}

export function useDeployedMetalk8sInstances() {
  return window.shellHooks.useDeployedApps({
    kind: 'metalk8s-ui',
  });
}

export function useDeployedXcoreInstances() {
  return window.shellHooks.useDeployedApps({
    kind: 'xcore-ui',
  });
}

export function useXcoreConfig(configType: 'run' | 'build' = 'build') {
  const { retrieveConfiguration } = window.shellHooks.useConfigRetriever();
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
  return window.shellHooks.useConfigRetriever();
}

// FIXME this is a temporary (hopefully) solution to get the Grafana URL
type Config = {
  url_grafana: string;
};
export function useGrafanaURL() {
  const { retrieveConfiguration } = window.shellHooks.useConfigRetriever();
  const instances = useDeployedMetalk8sInstances();

  if (instances.length) {
    const baseUrl = new URL(instances[0].url).origin;
    const runTimeConfig = retrieveConfiguration<Config>({
      configType: 'run',
      name: instances[0].name,
    });
    return baseUrl + runTimeConfig.spec.selfConfiguration.url_grafana;
  } else {
    console.log('There is no Metalk8s instance deployed yet.');
    return '';
  }
}
