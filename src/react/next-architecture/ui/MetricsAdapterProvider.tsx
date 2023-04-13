import { createContext, useContext } from 'react';
import { PensieveMetricsAdapter } from '../adapters/metrics/PensieveMetricsAdapter';
import { IMetricsAdapter } from '../adapters/metrics/IMetricsAdapter';

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

const MetricsAdapterProvider = ({ children }: { children: JSX.Element }) => {
  // We only need to change to SCUBA Adaptor later on.
  const metricsAdapter = new PensieveMetricsAdapter();
  return (
    <_MetricsAdapterContext.Provider value={{ metricsAdapter }}>
      {children}
    </_MetricsAdapterContext.Provider>
  );
};
export default MetricsAdapterProvider;
