import { useCallback } from 'react';
import { useLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useCapabilities } from '../../queries/instanceStatusQuery';
import { isIngestLocation } from '../../utils/storageOptions';
import { BucketCreateLocationEffects } from './BucketCreateLocationEffects';

export function useBucketCreateConfig() {
  const adapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints } = useLocationsAndEndpoints({
    locationsEndpointsAdapter: adapter,
  });
  const { capabilities } = useCapabilities();

  const locations = locationsAndEndpoints?.locations ?? [];

  const transformBucketCreateData = useCallback(
    <T extends Record<string, unknown>>(data: T): T => {
      const locationConstraint = data.locationConstraint as string;
      const isAsyncNotification = data.isAsyncNotification as boolean;

      if (isAsyncNotification && locationConstraint) {
        const location = locations.find((l) => l.name === locationConstraint);
        if (location && capabilities && isIngestLocation(location, capabilities)) {
          return {
            ...data,
            locationConstraint: `${locationConstraint}:ingest`,
          };
        }
      }

      return data;
    },
    [locations, capabilities],
  );

  return {
    bucketCreateExtraFields: <BucketCreateLocationEffects />,
    transformBucketCreateData,
  };
}
