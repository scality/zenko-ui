import type { Endpoint } from '../../../../types/config';
import type { AccountInfo } from '../../domain/entities/account';
import type { LocationInfo } from './ILocationsAdapter';

export interface IAccountsLocationsEndpointsAdapter {
  listAccountsLocationsAndEndpoints(): Promise<{
    accounts: AccountInfo[];
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }>;
}
