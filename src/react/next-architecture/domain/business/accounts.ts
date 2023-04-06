import { IMetricsAdaptor } from '../../adaptors/metrics/IMetricsAdaptor';
import { AccountsPromiseResult } from '../entities/account';

/**
 * The hook returns all the accounts and the storage metric for the first 20 accounts.
 * @param metricsAdaptor
 */
export const useListAccounts = ({
  metricsAdaptor,
}: {
  metricsAdaptor: IMetricsAdaptor;
}): AccountsPromiseResult => {
  throw new Error('Method not implemented.');
};

/**
 * The hook returns the latest used capacity for a specific account.
 * @param metricsAdaptor
 * @param accountId
 */
export const useAccountLatestUsedCapacity = ({
  metricsAdaptor,
  accountId,
}: {
  metricsAdaptor: IMetricsAdaptor;
  accountId: string;
}): AccountsPromiseResult => {
  throw new Error('Method not implemented.');
};
