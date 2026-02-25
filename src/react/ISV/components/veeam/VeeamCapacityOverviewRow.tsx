import { PrettyBytes } from '@scality/core-ui';
import { useGetBucketTagging, useGetObject } from '@scality/data-browser-library';
import { useCallback, useEffect, useState } from 'react';
import * as T from '../../../ui-elements/TableKeyValue2';
import {
  BUCKET_TAG_APPLICATION,
  BUCKET_TAG_VEEAM_APPLICATION,
  VEEAM_OBJECT_KEY,
  VeeamApplicationType,
} from '../../constants';
import { VeeamCapacityModal } from './VeeamCapacityModal';

function parseCapacityFromXml(xml: string): number {
  const text = new DOMParser().parseFromString(xml, 'application/xml').querySelector('Capacity')?.textContent;
  return text ? parseFloat(text) : 0;
}

async function readBodyAsString(body: NonNullable<unknown>): Promise<string> {
  if (typeof (body as Record<string, unknown>).transformToString === 'function') {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }
  return String(body);
}

const capacityCache = new Map<string, number>();

const VeeamCapacityContent = ({ bucketName }: { bucketName: string }) => {
  const { data: taggingData, status: taggingStatus } = useGetBucketTagging({
    Bucket: bucketName,
  });

  const tags: Record<string, string> = {};
  taggingData?.TagSet?.forEach((tag) => {
    if (tag.Key && tag.Value) tags[tag.Key] = tag.Value;
  });

  const veeamApp = tags[BUCKET_TAG_VEEAM_APPLICATION] || tags[BUCKET_TAG_APPLICATION];
  const isSOSAPIEnabled = veeamApp === VeeamApplicationType.VEEAM_BACKUP_REPLICATION;

  const {
    data: veeamObjectData,
    status: veeamObjectStatus,
    isLoading,
    isError,
  } = useGetObject(
    { Bucket: bucketName, Key: VEEAM_OBJECT_KEY },
    { enabled: taggingStatus === 'success' && isSOSAPIEnabled, retry: false, gcTime: 0 },
  );

  const [capacity, setCapacity] = useState(() => capacityCache.get(bucketName) ?? 0);

  useEffect(() => {
    const body = veeamObjectData?.Body;
    if (!body) return;
    readBodyAsString(body)
      .then((text) => {
        const parsed = parseCapacityFromXml(text);
        capacityCache.set(bucketName, parsed);
        setCapacity(parsed);
      })
      .catch(() => {
        const cached = capacityCache.get(bucketName);
        if (cached !== undefined) setCapacity(cached);
      });
  }, [veeamObjectData, bucketName]);

  const handleCapacityUpdated = useCallback(
    (bytes: number) => {
      capacityCache.set(bucketName, bytes);
      setCapacity(bytes);
    },
    [bucketName],
  );

  if (!isSOSAPIEnabled) return null;

  return (
    <T.Row>
      <T.Key> Max repository Capacity </T.Key>
      <T.GroupValues>
        {isLoading ? 'Loading...' : isError ? 'Error' : <PrettyBytes bytes={capacity} decimals={2} />}
        {!isLoading && !isError && (
          <VeeamCapacityModal
            bucketName={bucketName}
            maxCapacity={capacity}
            status={veeamObjectStatus}
            onCapacityUpdated={handleCapacityUpdated}
          />
        )}
      </T.GroupValues>
    </T.Row>
  );
};

export const VeeamCapacityOverviewRow = ({ bucketName }: { bucketName: string }) => {
  return <VeeamCapacityContent bucketName={bucketName} />;
};
