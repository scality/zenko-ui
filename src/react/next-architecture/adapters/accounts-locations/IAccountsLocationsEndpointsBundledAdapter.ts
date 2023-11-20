import { Endpoint } from '../../../../types/config';
import { AccountInfo } from '../../domain/entities/account';
import { LocationInfo } from './ILocationsAdapter';

export interface IAccountsLocationsEndpointsAdapter {
  listAccountsLocationsAndEndpoints(): Promise<{
    accounts: AccountInfo[];
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }>;
}
