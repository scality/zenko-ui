import { Loader } from '@scality/core-ui';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import type { Bucket } from '@scality/data-browser-library';
import { useGetBucketLocation } from '@scality/data-browser-library';
import { useInstanceStatusQuery } from '../../queries/instanceStatusQuery';
import { getLocationIngestionState } from '../../utils/storageOptions';

export const MetadataUpdatesColumn = ({ data }: { data: Bucket }) => {
  const {
    data: bucketLocation,
    status: locationStatus,
  } = useGetBucketLocation({ Bucket: data.Name });

  const {
    data: instanceStatus,
    status: instanceStatusStatus,
  } = useInstanceStatusQuery();

  // 'pending' (react-query v5 via data-browser-library) vs 'loading' (react-query v3 via useInstanceStatusQuery)
  if (locationStatus === 'pending' || instanceStatusStatus === 'loading') {
    return <Loader size="small" />;
  }

  if (locationStatus === 'error' || instanceStatusStatus === 'error')
    return <EmptyCell mr={0} />;

  const locationConstraint = bucketLocation?.LocationConstraint || 'us-east-1';
  const ingestionStates =
    instanceStatus?.metrics?.['ingest-schedule']?.states;
  const { value } = getLocationIngestionState(
    ingestionStates,
    locationConstraint,
  );

  if (value === '-') return <EmptyCell mr={0} />;
  return <>{value}</>;
};
