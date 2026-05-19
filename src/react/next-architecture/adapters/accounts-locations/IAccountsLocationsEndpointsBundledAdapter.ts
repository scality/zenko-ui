import type { Endpoint } from '../../../../types/config';
import type { LocationInfo } from './ILocationsAdapter';

export interface IAccountsLocationsEndpointsAdapter {
  listAccountsLocationsAndEndpoints(): Promise<{
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }>;
}
