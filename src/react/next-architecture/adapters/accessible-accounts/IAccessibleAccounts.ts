import type { AccountInfo, Role } from '../../domain/entities/account';
import type { PromiseResult } from '../../domain/entities/promise';

export interface IAccessibleAccounts {
  useListAccessibleAccounts(): {
    accountInfos: PromiseResult<(AccountInfo & { assumableRoles: Role[] })[]>;
  };
}
