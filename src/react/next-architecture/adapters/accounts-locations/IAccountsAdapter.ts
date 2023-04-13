import { AccountInfo } from '../../domain/entities/account';

export interface IAccountsAdapter {
  listAccounts(): Promise<AccountInfo[]>;
}
