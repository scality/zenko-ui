import { defaultEventDispatcher, useAccounts } from '../../../utils/hooks';
import type { AccountInfo, Role } from '../../domain/entities/account';
import type { PromiseResult } from '../../domain/entities/promise';
import type { IAccessibleAccounts } from './IAccessibleAccounts';

export class IAMPensieveAccessibleAccounts implements IAccessibleAccounts {
  constructor(private withEventDispatcher = defaultEventDispatcher) {}

  useListAccessibleAccounts(): {
    accountInfos: PromiseResult<(AccountInfo & { assumableRoles: Role[] })[]>;
  } {
    const { accounts, status } = useAccounts(this.withEventDispatcher);

    if (status === 'error') {
      return {
        accountInfos: {
          status: 'error',
          title: 'An error occurred while fetching the accounts',
          reason: 'Internal error',
        },
      };
    }

    if (status === 'loading' || status === 'idle') {
      return {
        accountInfos: {
          status: 'loading',
        },
      };
    }

    const value: (AccountInfo & { assumableRoles: Role[] })[] = (accounts || []).map((account) => ({
      id: account.id,
      name: account.Name,
      canonicalId: account.canonicalId,
      creationDate: account.CreationDate,
      assumableRoles: account.Roles,
    }));

    return {
      accountInfos: {
        status: 'success',
        value,
      },
    };
  }
}
