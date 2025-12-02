import { Loader } from '@scality/core-ui';
import {
  useGetBucketLocation,
  useBucketOverviewContext,
} from '@scality/data-browser-library';
import { useLocationAndStorageInfos } from '../../next-architecture/domain/business/locations';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';

export function LocationSection() {
  const { bucketName } = useBucketOverviewContext();

  const { data: bucketLocation, status } = useGetBucketLocation({
    Bucket: bucketName,
  });

  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const locationConstraint = bucketLocation?.LocationConstraint || 'us-east-1';
  const locationInfos = useLocationAndStorageInfos({
    accountsLocationsEndpointsAdapter,
    locationName: locationConstraint,
  });

  if (status === 'pending') {
    return <Loader size="small" />;
  }

  if (status === 'error') {
    return <>Error</>;
  }

  if (
    locationInfos.status === 'loading' ||
    locationInfos.status === 'unknown'
  ) {
    return <Loader size="small" />;
  }

  if (locationInfos.status === 'error') {
    return <>{locationConstraint || 'us-east-1'}</>;
  }

  return <>{locationInfos.value.nameAndShortType}</>;
}
