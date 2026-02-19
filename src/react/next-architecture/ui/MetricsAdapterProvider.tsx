import { useShellHooks } from '@scality/module-federation';
import { createContext, type ReactNode, useContext } from 'react';
import type { IMetricsAdapter } from '../adapters/metrics/IMetricsAdapter';
import { PensieveMetricsAdapter } from '../adapters/metrics/PensieveMetricsAdapter';
import { useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';

const _MetricsAdapterContext = createContext<null | {
  metricsAdapter: IMetricsAdapter;
}>(null);

export const useMetricsAdapter = (): IMetricsAdapter => {
  const context = useContext(_MetricsAdapterContext);

  if (!context) {
    throw new Error('The useMetricsAdapter hook can only be used within MetricsAdapterProvider.');
  }

  return context.metricsAdapter;
};

const MetricsAdapterProvider = ({ children }: { children: ReactNode }) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const instanceId = useInstanceId();
  const { managementEndpoint } = useConfig();
  // We only need to change to SCUBA Adaptor later on.
  const metricsAdapter = new PensieveMetricsAdapter(managementEndpoint, instanceId, getToken);
  return <_MetricsAdapterContext.Provider value={{ metricsAdapter }}>{children}</_MetricsAdapterContext.Provider>;
};
export default MetricsAdapterProvider;
