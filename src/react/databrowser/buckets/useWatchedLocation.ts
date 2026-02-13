import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useCapabilities } from '../../queries/instanceStatusQuery';
import {
  isAzureOrGcpLocation,
  isIngestLocation,
} from '../../utils/storageOptions';

export function useWatchedLocation() {
  const { watch } = useFormContext();
  const locationConstraint = watch('locationConstraint');

  const adapter = useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter: adapter,
  });
  const { capabilities } = useCapabilities();

  const locations = accountsLocationsAndEndpoints?.locations ?? [];
  const watchedLocation = locations.find(
    (l) => l.name === locationConstraint,
  );

  const isAzureOrGcp =
    !!watchedLocation && isAzureOrGcpLocation(watchedLocation);

  const isIngest = useMemo(
    () =>
      !!locationConstraint &&
      !!watchedLocation &&
      !!capabilities &&
      isIngestLocation(watchedLocation, capabilities),
    [locationConstraint, watchedLocation, capabilities],
  );

  return {
    locationConstraint,
    watchedLocation,
    locations,
    capabilities,
    isAzureOrGcp,
    isIngest,
  };
}
