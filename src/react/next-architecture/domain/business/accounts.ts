import { IAccountsAdapter } from '../../adapters/accounts-locations/IAccountsAdapter';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import {
  AccountLatestUsedCapacityPromiseResult,
  AccountsPromiseResult,
} from '../entities/account';

/**
 * The hook returns the entire account list and the storage metric for the first one thousand of accounts.
 * @param metricsAdapter
 * @param accountsAdapter
 */
export const useListAccounts = ({
  accountsAdapter,
  metricsAdapter,
}: {
  accountsAdapter: IAccountsAdapter;
  metricsAdapter: IMetricsAdapter;
}): AccountsPromiseResult => {
  throw new Error('Method not implemented.');
};

/**
 * The hook returns the latest used capacity for a specific account, calling it in the Account Table Data Used Cell.
 * It will be enabled after retrieving the accounts and will update the cache of account-metrics.
 * @param metricsAdapter
 * @param accountCanonicalId
 */
export const useAccountLatestUsedCapacity = ({
  metricsAdapter,
  accountCanonicalId,
}: {
  metricsAdapter: IMetricsAdapter;
  accountCanonicalId: string;
}): AccountLatestUsedCapacityPromiseResult => {
  // check if the account metric has already exist in the cache
  throw new Error('Method not implemented.');
};
