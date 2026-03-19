import { Loader } from '@scality/core-ui';
import type { Bucket } from '@scality/data-browser-library';
import { useBucketLocationDisplay } from '../hooks/useBucketLocationDisplay';

export const StorageLocationColumn = ({ data }: { data: Bucket }) => {
  const bucketName = data.Name;
  const locationResult = useBucketLocationDisplay(bucketName);

  if (locationResult.status === 'loading') {
    return <Loader size="small" />;
  }

  if (locationResult.status === 'error') {
    return <>{locationResult.fallback}</>;
  }

  return <>{locationResult.display}</>;
};
