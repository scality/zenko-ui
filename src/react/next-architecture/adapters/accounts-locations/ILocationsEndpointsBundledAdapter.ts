import type { Endpoint } from '../../../../types/config';
import type { LocationInfo } from './ILocationsAdapter';

export interface ILocationsEndpointsAdapter {
  listLocationsAndEndpoints(): Promise<{
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }>;
}
