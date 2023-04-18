import { AccountInfo } from '../../domain/entities/account';
import { IAccountsAdapter } from './IAccountsAdapter';
import { ILocationsAdapter } from './ILocationsAdapter';

export class PensieveAccountsAdapter
  implements IAccountsAdapter, ILocationsAdapter
{
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private token: string,
  ) {}
  listLocations(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  listAccounts(): Promise<AccountInfo[]> {
    throw new Error('Method not implemented.');
  }
}
