import { useAccounts } from '../../../utils/hooks';
import { useAccountsLocationsAndEndpoints } from '../../domain/business/accounts';
import { AccountInfo, Role } from '../../domain/entities/account';
import { PromiseResult } from '../../domain/entities/promise';
import { IAccessibleAccounts } from './IAccessibleAccounts';
import { IAccountsLocationsEndpointsAdapter } from '../accounts-locations/IAccountsLocationsEndpointsBundledAdapter';

export class IAMPensieveAccessibleAccounts implements IAccessibleAccounts {
  constructor(
    private accountsLocationsAndEndpointsAdapter: IAccountsLocationsEndpointsAdapter,
  ) {}
  useListAccessibleAccounts(): {
    accountInfos: PromiseResult<(AccountInfo & { assumableRoles: Role[] })[]>;
  } {
    const { accountsLocationsAndEndpoints, status: accountStatus } =
      useAccountsLocationsAndEndpoints({
        accountsLocationsEndpointsAdapter:
          this.accountsLocationsAndEndpointsAdapter,
      });
    const { accounts: accessibleAccounts, status } = useAccounts();

    if (accountStatus === 'error' || status === 'error') {
      return {
        accountInfos: {
          status: 'error',
          title: 'An error occurred while fetching the accounts',
          reason: 'Internal error',
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

    const value = (accountsLocationsAndEndpoints?.accounts || []).flatMap(
      (account) => {
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
      },
    );
    return {
      accountInfos: {
        status: 'success',
        value,
      },
    };
  }
}
