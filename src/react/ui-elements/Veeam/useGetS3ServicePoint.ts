import { useMemo } from 'react';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';

export const useGetS3ServicePoint = () => {
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter,
  });

  const s3ServicePoint = useMemo(
    () => accountsLocationsAndEndpoints?.endpoints[0].hostname,
    [accountsLocationsAndEndpoints],
  );

  return { s3ServicePoint: s3ServicePoint || '' };
};
