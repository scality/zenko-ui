import prettyBytes from 'pretty-bytes';
import { VEEAM_FEATURE } from '../../../js/config';
import { useBucketTagging } from '../../next-architecture/domain/business/buckets';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { useS3Client } from '../../next-architecture/ui/S3ClientProvider';
import { getVeeamObject } from '../../queries';
import * as T from '../TableKeyValue2';
import { VeeamCapacityModal } from './VeeamCapacityModal';
import {
  BUCKET_TAG_VEEAM_APPLICATION,
  VeeamApplicationType,
} from './VeeamConstants';
import { decodeEntities } from './decodeEntities';
import { useQuery } from 'react-query';

export const VeeamCapacityOverviewRow = ({
  bucketName,
}: {
  bucketName: string;
}) => {
  const s3Client = useS3Client();
  const { tags } = useBucketTagging({ bucketName });
  const { features } = useConfig();
  const VEEAM_FEATURE_FLAG_ENABLED = features.includes(VEEAM_FEATURE);
  const veeamTagApplication =
    tags.status === 'success' &&
    decodeEntities(tags.value?.[BUCKET_TAG_VEEAM_APPLICATION]);

  const isSOSAPIEnabled =
    veeamTagApplication === VeeamApplicationType.VEEAM_BACKUP_REPLICATION &&
    VEEAM_FEATURE_FLAG_ENABLED;

  const { data: veeamObject, status: veeamObjectStatus } = useQuery(
    getVeeamObject({
      bucketName,
      s3Client,
    }),
  );

  const xml = veeamObject?.Body?.toString();
  const capacity =
    new DOMParser()
      ?.parseFromString(xml || '', 'application/xml')
      ?.querySelector('Capacity')?.textContent || '0';
  const prettyBytesClusterCapacity = prettyBytes(parseInt(capacity, 10), {
    locale: 'en',
    binary: true,
  });

  if (isSOSAPIEnabled) {
    return (
      <T.Row>
        <T.Key> Max repository Capacity </T.Key>
        <T.GroupValues>
          <>
            {veeamObjectStatus === 'loading'
              ? 'Loading...'
              : veeamObjectStatus === 'error'
              ? 'Error'
              : prettyBytesClusterCapacity}
          </>
          <VeeamCapacityModal
            bucketName={bucketName}
            maxCapacity={prettyBytesClusterCapacity}
            status={veeamObjectStatus}
          />
        </T.GroupValues>
      </T.Row>
    );
  }

  return <></>;
};
