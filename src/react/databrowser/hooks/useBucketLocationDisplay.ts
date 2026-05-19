import { useGetBucketLocation } from '@scality/data-browser-library';
import { useLocationAndStorageInfos } from '../../next-architecture/domain/business/locations';
import { useLocationsEndpointsAdapter } from '../../next-architecture/ui/LocationsEndpointsAdapterProvider';

type LocationDisplayResult =
  | { status: 'loading' }
  | { status: 'error'; fallback: string }
  | { status: 'success'; display: string };

/**
 * Custom hook to fetch and format bucket location display information.
 * Consolidates the common pattern of fetching bucket location information
 *
 * @param bucketName - Name of the bucket
 * @returns Location display state with status and display text
 */
export const useBucketLocationDisplay = (bucketName: string): LocationDisplayResult => {
  const { data: bucketLocation, status } = useGetBucketLocation({
    Bucket: bucketName,
  });

  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();
  const locationConstraint = bucketLocation?.LocationConstraint || 'us-east-1';
  const locationInfos = useLocationAndStorageInfos({
    locationsEndpointsAdapter,
    locationName: locationConstraint,
  });

  if (status === 'pending') {
    return { status: 'loading' };
  }

  if (status === 'error') {
    return { status: 'error', fallback: 'Error loading location' };
  }

  if (locationInfos.status === 'loading' || locationInfos.status === 'unknown') {
    return { status: 'loading' };
  }

  if (locationInfos.status === 'error') {
    return { status: 'error', fallback: locationConstraint };
  }

  return { status: 'success', display: locationInfos.value.nameAndShortType };
};
