import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import { LocationsPromiseResult } from '../entities/location';

/**
 * The hook returns all the locations and it's metrics
 * @param metricsAdapter
 */
export const useListLocations = ({
  metricsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
}): LocationsPromiseResult => {
  throw new Error('Method not implemented.');
};

export const useListLocationsForCurrentAccount = ({
  metricsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
}): LocationsPromiseResult => {
  throw new Error('Method not implemented.');
};
