import { useCurrentApp } from '@scality/module-federation';
import { createContext } from 'react';
import {
  BuildtimeWebFinger,
  RuntimeWebFinger,
} from 'shell/moduleFederation/ConfigurationProvider';
import { AppConfig } from '../../../types/entities';
import { useShellHooks } from '@scality/module-federation';

export const _ConfigContext = createContext<AppConfig | null>(null);

export function useConfig(): AppConfig {
  const { name } = useCurrentApp();
  const { useConfig } = useShellHooks();
  return useConfig({
    configType: 'run',
    name,
  }).spec.selfConfiguration;
}

export function useDeployedMetalk8sInstances() {
  const { useDeployedApps } = useShellHooks();
  return useDeployedApps({
    kind: 'metalk8s-ui',
  });
}

export function useDeployedXcoreInstances() {
  const { useDeployedApps } = useShellHooks();
  return useDeployedApps({
    kind: 'xcore-ui',
  });
}
type XCoreRuntimeConfig = {
  url: string;
  url_prometheus: string;
  url_grafana: string;
  url_alertmanager: string;
  ui_base_path: string;
};

export function useXcoreRuntimeConfig(): RuntimeWebFinger<XCoreRuntimeConfig> | null {
  const { useConfigRetriever } = useShellHooks();
  const { retrieveConfiguration } = useConfigRetriever();
  const instances = useDeployedXcoreInstances();

  if (instances.length) {
    return retrieveConfiguration({
      configType: 'run',
      name: instances[0].name,
    });
  }
  console.log('There is no Xcore instance deployed yet.');
  return null;
}

export function useXcoreBuildtimeConfig(): BuildtimeWebFinger | null {
  const { useConfigRetriever } = useShellHooks();
  const { retrieveConfiguration } = useConfigRetriever();
  const instances = useDeployedXcoreInstances();

  if (instances.length) {
    return retrieveConfiguration({
      configType: 'build',
      name: instances[0].name,
    });
  }
  console.log('There is no Xcore instance deployed yet.');
  return null;
}

export function useGrafanaURL() {
  const { useConfigRetriever } = useShellHooks();
  const { retrieveConfiguration } = useConfigRetriever();
  const instances = useDeployedMetalk8sInstances();

  if (instances.length) {
    const runTimeConfig = retrieveConfiguration({
      configType: 'run',
      name: instances[0].name,
    });
    return runTimeConfig.spec.selfConfiguration.url_grafana;
  }
  console.log('There is no Metalk8s instance deployed yet.');
  return '';
}
