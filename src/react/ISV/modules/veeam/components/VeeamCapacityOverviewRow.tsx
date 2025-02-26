import { useQuery } from 'react-query';

import { useBucketTagging } from '../../../../next-architecture/domain/business/buckets';

import { useS3Client } from '../../../../next-architecture/ui/S3ClientProvider';
import { getObjectQuery } from '../../../../queries';
import * as T from '../../../../ui-elements/TableKeyValue2';
import { VeeamCapacityModal } from './VeeamCapacityModal';
import {
  BUCKET_TAG_VEEAM_APPLICATION,
  VEEAM_OBJECT_KEY,
  VeeamApplicationType,
} from '../../../constants';
import { PrettyBytes } from '@scality/core-ui';

export const VeeamCapacityOverviewRow = ({
  bucketName,
}: {
  bucketName: string;
}) => {
  const s3Client = useS3Client();
  const { tags } = useBucketTagging({ bucketName });

  const veeamTagApplication =
    tags.status === 'success' && tags.value?.[BUCKET_TAG_VEEAM_APPLICATION];

  const isSOSAPIEnabled =
    veeamTagApplication === VeeamApplicationType.VEEAM_BACKUP_REPLICATION;

  const { data: veeamObject, status: veeamObjectStatus } = useQuery(
    getObjectQuery({
      bucketName,
      s3Client,
      key: VEEAM_OBJECT_KEY,
    }),
  );

  const xml = veeamObject?.Body?.toString();
  const regex = /<Capacity>([\s\S]*?)<\/Capacity>/;
  const matches = xml?.match(regex);
  const capacity = parseFloat(
    new DOMParser()
      ?.parseFromString(xml || '', 'application/xml')
      ?.querySelector('Capacity')?.textContent ||
      matches?.[1] ||
      '0',
  );

  if (isSOSAPIEnabled) {
    return (
      <T.Row>
        <T.Key> Max repository Capacity </T.Key>
        <T.GroupValues>
          <>
            {veeamObjectStatus === 'loading' ? (
              'Loading...'
            ) : veeamObjectStatus === 'error' ? (
              'Error'
            ) : (
              <PrettyBytes bytes={capacity} decimals={2} />
            )}
          </>
          {veeamObjectStatus === 'success' && (
            <VeeamCapacityModal
              bucketName={bucketName}
              maxCapacity={capacity}
              status={veeamObjectStatus}
            />
          )}
        </T.GroupValues>
      </T.Row>
    );
  }

  return <></>;
};
