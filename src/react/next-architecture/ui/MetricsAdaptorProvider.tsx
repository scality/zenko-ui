import { createContext, useContext } from 'react';
import { PensieveMetricsAdaptor } from '../adaptors/metrics/PensieveMetricsAdaptor';
import { IMetricsAdaptor } from '../adaptors/metrics/IMetricsAdaptor';

const _MetricsAdaptorContext = createContext<null | {
  metricsAdaptor: IMetricsAdaptor;
}>(null);

export const useMetricsAdaptor = (): IMetricsAdaptor => {
  const context = useContext(_MetricsAdaptorContext);

  if (!context) {
    throw new Error(
      'The useMetricsAdaptor hook can only be used within MetricsAdaptorProvider.',
    );
  }

  return context.metricsAdaptor;
};

const MetricsAdaptorProvider = ({ children }: { children: JSX.Element }) => {
  // We only need to change to SCUBA Adaptor later on.
  const metricsAdaptor = new PensieveMetricsAdaptor();
  return (
    <_MetricsAdaptorContext.Provider value={{ metricsAdaptor }}>
      {children}
    </_MetricsAdaptorContext.Provider>
  );
};
export default MetricsAdaptorProvider;
