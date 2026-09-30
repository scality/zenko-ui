import { BucketOverviewField, useBucketOverviewContext, useGetBucketTagging } from '@scality/data-browser-library';
import { VeeamCapacityOverviewRow } from '../../ISV/components/veeam/VeeamCapacityOverviewRow';
import { detectBucketApplication } from '../utils/bucketApplicationDetector';

/**
 * Displays the ISV application use-case for a bucket.
 * Shows application type (Veeam, Commvault, or S3 Generic) and
 * conditionally displays Veeam capacity metrics.
 */
export const UseCaseSection = () => {
  const { bucketName } = useBucketOverviewContext();

  const { data: taggingData, status: taggingStatus } = useGetBucketTagging({
    Bucket: bucketName,
  });

  // Convert TagSet array to key-value object
  const tags: Record<string, string> = {};
  if (taggingStatus === 'success' && taggingData?.TagSet) {
    taggingData.TagSet.forEach((tag) => {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    });
  }

  // Detect application type and determine what to display
  const application = detectBucketApplication(tags);

  return (
    <>
      <BucketOverviewField label="Application" value={application.displayName} />
      {application.shouldShowVeeamCapacity && <VeeamCapacityOverviewRow bucketName={bucketName} />}
    </>
  );
};
