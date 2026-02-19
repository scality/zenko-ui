import { useBuckets, useGetBucketLocation } from '@scality/data-browser-library';
import { memo } from 'react';

/**
 * Single bucket location prefetcher.
 * Triggers the useGetBucketLocation hook to populate React Query cache.
 */
const HiddenLocationFetcher = memo(({ bucketName }: { bucketName: string }) => {
  useGetBucketLocation({ Bucket: bucketName });
  return null;
});

HiddenLocationFetcher.displayName = 'HiddenLocationFetcher';

/**
 * Prefetch component for bucket locations.
 */
export const BucketLocationsPrefetch = () => {
  const { data: bucketsData } = useBuckets();
  const buckets = bucketsData?.Buckets || [];

  // Early return for empty state
  if (buckets.length === 0) {
    return null;
  }

  return (
    <>
      {buckets.map((bucket) => (
        <HiddenLocationFetcher key={bucket.Name} bucketName={bucket.Name} />
      ))}
    </>
  );
};
