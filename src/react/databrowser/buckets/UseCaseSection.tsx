import {
  BUCKET_TAG_APPLICATION,
  BUCKET_TAG_VEEAM_APPLICATION,
  COMMVAULT_APPLICATION,
  VEEAM_BACKUP_REPLICATION,
} from '../../ISV/constants';
import { VeeamApplicationType } from '../../ISV/constants';
import { VEEAM_VBO_APPLICATION } from '../../ISV/modules/veeam-vbo';
import {
  useGetBucketTagging,
  useBucketOverviewContext,
} from '@scality/data-browser-library';
import { VeeamCapacityOverviewRow } from '../../ISV/modules/veeam/components/VeeamCapacityOverviewRow';
import { Row, Key, Value } from '../../ui-elements/TableKeyValue2';

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

  // Keep this to avoid breaking changes
  const veeamTagApplication =
    taggingStatus === 'success' && tags[BUCKET_TAG_VEEAM_APPLICATION];
  // New tag for ISV application
  const ISVApplicationTag =
    taggingStatus === 'success' && tags[BUCKET_TAG_APPLICATION];

  const isVeeamBucket =
    veeamTagApplication === VeeamApplicationType.VEEAM_BACKUP_REPLICATION ||
    veeamTagApplication === VeeamApplicationType.VEEAM_OFFICE_365 ||
    veeamTagApplication === VeeamApplicationType.VEEAM_OFFICE_365_V8;
  const isISVBucketTagAsVeeam =
    ISVApplicationTag === VEEAM_BACKUP_REPLICATION ||
    ISVApplicationTag === VEEAM_VBO_APPLICATION;
  const isISVCommvault = ISVApplicationTag === COMMVAULT_APPLICATION;

  const applicationValue = isISVCommvault
    ? COMMVAULT_APPLICATION
    : isVeeamBucket || isISVBucketTagAsVeeam
    ? `${veeamTagApplication || ISVApplicationTag || 'S3 Generic'}`
    : ISVApplicationTag || 'S3 Generic';

  const shouldShowVeeamCapacity =
    ISVApplicationTag === VEEAM_BACKUP_REPLICATION ||
    veeamTagApplication === VEEAM_BACKUP_REPLICATION;

  return (
    <>
      <Row>
        <Key>Application</Key>
        <Value>{applicationValue}</Value>
      </Row>
      {shouldShowVeeamCapacity && (
        <VeeamCapacityOverviewRow bucketName={bucketName} />
      )}
    </>
  );
};
