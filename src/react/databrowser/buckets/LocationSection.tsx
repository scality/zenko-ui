import { Loader } from '@scality/core-ui';
import { useBucketOverviewContext } from '@scality/data-browser-library';
import { useBucketLocationDisplay } from '../hooks/useBucketLocationDisplay';

export function LocationSection() {
  const { bucketName } = useBucketOverviewContext();
  const locationResult = useBucketLocationDisplay(bucketName);

  if (locationResult.status === 'loading') {
    return <Loader size="small" />;
  }

  if (locationResult.status === 'error') {
    return <>{locationResult.fallback}</>;
  }

  return <>{locationResult.display}</>;
}
