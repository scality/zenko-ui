import {
  useGetBucketTagging,
  useGetObject,
} from '@scality/data-browser-library';
import * as T from '../../../../ui-elements/TableKeyValue2';
import { VeeamCapacityModal } from './VeeamCapacityModal';
import {
  BUCKET_TAG_APPLICATION,
  BUCKET_TAG_VEEAM_APPLICATION,
  VEEAM_OBJECT_KEY,
  VeeamApplicationType,
} from '../../../constants';
import { PrettyBytes } from '@scality/core-ui';

const VeeamCapacityContent = ({ bucketName }: { bucketName: string }) => {
  const { data: taggingData, status: taggingStatus } = useGetBucketTagging({
    Bucket: bucketName,
  });

  const tags: Record<string, string> = {};
  if (taggingStatus === 'success' && taggingData?.TagSet) {
    taggingData.TagSet.forEach((tag) => {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    });
  }

  const veeamTagApplication =
    tags[BUCKET_TAG_VEEAM_APPLICATION] || tags[BUCKET_TAG_APPLICATION];

  const isSOSAPIEnabled =
    veeamTagApplication === VeeamApplicationType.VEEAM_BACKUP_REPLICATION;

  const {
    data: veeamObjectData,
    status: veeamObjectStatus,
    isLoading,
    isError,
  } = useGetObject(
    {
      Bucket: bucketName,
      Key: VEEAM_OBJECT_KEY,
    },
    {
      enabled: taggingStatus === 'success' && isSOSAPIEnabled,
      retry: false,
    },
  );

  const xml = veeamObjectData?.Body?.toString();
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
            {isLoading ? (
              'Loading...'
            ) : isError ? (
              'Error'
            ) : (
              <PrettyBytes bytes={capacity} decimals={2} />
            )}
          </>
          {!isLoading && !isError && (
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

export const VeeamCapacityOverviewRow = ({
  bucketName,
}: {
  bucketName: string;
}) => {
  return <VeeamCapacityContent bucketName={bucketName} />;
};
