import { createContext, useContext, ReactNode } from 'react';
import { PensieveMetricsAdapter } from '../adapters/metrics/PensieveMetricsAdapter';
import { IMetricsAdapter } from '../adapters/metrics/IMetricsAdapter';
import { useAccessToken, useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';

const _MetricsAdapterContext = createContext<null | {
  metricsAdapter: IMetricsAdapter;
}>(null);

export const useMetricsAdapter = (): IMetricsAdapter => {
  const context = useContext(_MetricsAdapterContext);

  if (!context) {
    throw new Error(
      'The useMetricsAdapter hook can only be used within MetricsAdapterProvider.',
    );
  }

  return context.metricsAdapter;
};

const MetricsAdapterProvider = ({ children }: { children: ReactNode }) => {
  const token = useAccessToken();
  const instanceId = useInstanceId();
  const { managementEndpoint } = useConfig();
  // We only need to change to SCUBA Adaptor later on.
  const metricsAdapter = new PensieveMetricsAdapter(
    managementEndpoint,
    instanceId,
    token,
  );
  return (
    <_MetricsAdapterContext.Provider value={{ metricsAdapter }}>
      {children}
    </_MetricsAdapterContext.Provider>
  );
};
export default MetricsAdapterProvider;
