import { AccountInfo } from '../../domain/entities/account';
import { PromiseResult } from '../../domain/entities/promise';

export interface IAccessibleAccounts {
  useListAccessibleAccounts(): {
    accountInfos: PromiseResult<AccountInfo[]>;
  };
}
