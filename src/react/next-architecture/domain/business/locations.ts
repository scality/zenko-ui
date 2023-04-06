import { IMetricsAdaptor } from '../../adaptors/metrics/IMetricsAdaptor';
import { LocationsPromiseResult } from '../entities/location';

/**
 * The hook returns all the locations and it's metrics
 * @param metricsAdaptor
 */
export const useListLocations = ({
  metricsAdaptor,
}: {
  metricsAdaptor: IMetricsAdaptor;
}): LocationsPromiseResult => {
  throw new Error('Method not implemented.');
};

export const useListLocationsForCurrentAccount = ({
  metricsAdaptor,
}: {
  metricsAdaptor: IMetricsAdaptor;
}): LocationsPromiseResult => {
  throw new Error('Method not implemented.');
};
