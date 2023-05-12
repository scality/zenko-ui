import { useQuery } from 'react-query';
import { useAccounts } from '../../../utils/hooks';
import { queries } from '../../domain/business/accounts';
import { AccountInfo, Role } from '../../domain/entities/account';
import { PromiseResult } from '../../domain/entities/promise';
import { IAccountsAdapter } from '../accounts-locations/IAccountsAdapter';
import { IAccessibleAccounts } from './IAccessibleAccounts';

export class IAMPensieveAccessibleAccounts implements IAccessibleAccounts {
  constructor(private accountsAdapter: IAccountsAdapter) {}
  useListAccessibleAccounts(): {
    accountInfos: PromiseResult<(AccountInfo & { assumableRoles: Role[] })[]>;
  } {
    const { data: accountInfos, status: accountStatus } = useQuery(
      queries.listAccounts(this.accountsAdapter),
    );
    const { accounts: accessibleAccounts, status } = useAccounts();

    if (accountStatus === 'error' || status === 'error') {
      return {
        accountInfos: {
          status: 'error',
          title: 'An error occurred while fetching the accounts',
          reason: 'Interal error',
        },
      };
    }

    if (
      accountStatus === 'loading' ||
      status === 'loading' ||
      accountStatus === 'idle' ||
      status === 'idle'
    ) {
      return {
        accountInfos: {
          status: 'loading',
        },
      };
    }

    const value = accountInfos.flatMap((account) => {
      const accessibleAccount = accessibleAccounts.find(
        (ac) => ac.id === account.id,
      );
      if (accessibleAccount) {
        return [
          {
            ...account,
            assumableRoles: accessibleAccount.Roles,
          },
        ];
      }
      return [];
    });
    return {
      accountInfos: {
        status: 'success',
        value,
      },
    };
  }
}
