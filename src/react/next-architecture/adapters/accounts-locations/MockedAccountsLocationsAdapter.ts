import {
  ACCOUNT,
  NEWLY_CREATED_ACCOUNT,
} from '../../../../js/mock/managementClientStorageConsumptionMetricsHandlers';
import { AccountInfo } from '../../domain/entities/account';
import { IAccountsAdapter } from './IAccountsAdapter';
import { ILocationsAdapter } from './ILocationsAdapter';

export class MockedAccountsAdapter
  implements IAccountsAdapter, ILocationsAdapter
{
  listLocations(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  listAccounts = jest
    .fn()
    .mockImplementation(async (): Promise<AccountInfo[]> => {
      return [ACCOUNT, NEWLY_CREATED_ACCOUNT];
    });
}
