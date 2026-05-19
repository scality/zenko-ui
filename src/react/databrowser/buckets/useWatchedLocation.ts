import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useCapabilities } from '../../queries/instanceStatusQuery';
import { isAzureOrGcpLocation, isIngestLocation } from '../../utils/storageOptions';

export function useWatchedLocation() {
  const { watch } = useFormContext();
  const locationConstraint = watch('locationConstraint');

  const adapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints } = useLocationsAndEndpoints({
    locationsEndpointsAdapter: adapter,
  });
  const { capabilities } = useCapabilities();

  const locations = locationsAndEndpoints?.locations ?? [];
  const watchedLocation = locations.find((l) => l.name === locationConstraint);

  const isAzureOrGcp = !!watchedLocation && isAzureOrGcpLocation(watchedLocation);

  const isIngest = useMemo(
    () =>
      !!locationConstraint && !!watchedLocation && !!capabilities && isIngestLocation(watchedLocation, capabilities),
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
