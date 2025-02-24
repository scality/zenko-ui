import { useMemo } from 'react';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';

export const useGetS3ServicePoint = () => {
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();

  const { accountsLocationsAndEndpoints, status } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter,
    });
  const s3ServicePoint = useMemo(
    () =>
      accountsLocationsAndEndpoints?.endpoints?.find(
        (endpoint) => !endpoint.isBuiltin,
      )?.hostname || '',
    [accountsLocationsAndEndpoints, status],
  );

  return { s3ServicePoint };
};
