import { Select } from '@scality/core-ui/dist/next';
import { SelectProps } from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import {
  useBucketLocationConstraint,
  useBucketTagging,
  useBucketVersionning,
  useListBucketsForCurrentAccount,
} from '../next-architecture/domain/business/buckets';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { useLocationAndStorageInfos } from '../next-architecture/domain/business/locations';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { BUCKET_TAG_VEEAM_APPLICATION } from '../ui-elements/Veeam/VeeamConstants';
import { Loader, useToast } from '@scality/core-ui';
import { useEffect } from 'react';

type DisableOptionProps = {
  disableOption?: (obj: {
    isBucketVersionned?: boolean;
    isReplicationSourceSupported?: boolean;
    isVeeamBucket: boolean;
  }) => { disabled: boolean; disabledMessage?: JSX.Element };
};

export const SourceBucketSelect = (
  props: Omit<SelectProps, 'children'> &
    DisableOptionProps & { readonly?: boolean },
) => {
  const metricsAdapter = useMetricsAdapter();
  const { buckets } = useListBucketsForCurrentAccount({ metricsAdapter });
  if (buckets.status === 'loading' || buckets.status === 'unknown')
    return <>Loading buckets...</>;
  if (buckets.status === 'error') return <>Error while loading buckets</>;

  if (props.readonly) {
    if (!props.value) return <>-</>;
    const bucketStillExists = !!buckets.value.find(
      (bucket) => bucket.name === props.value,
    );
    if (!bucketStillExists) {
      return (
        <span>
          {' '}
          {props.value}{' '}
          <small>(depreciated because entity does not exist) </small>{' '}
        </span>
      );
    }

    return (
      <>
        {props.value}
        {/* @ts-expect-error fix this when you are working on it */}
        (<BucketLocationNameAndType bucketName={props.value} />)
      </>
    );
  }

  return (
    <Select {...{ ...props, disableOptions: undefined }}>
      {buckets.value.map((bucket) => (
        <SourceBucketOption
          key={bucket.name}
          bucketName={bucket.name}
          disableOption={props.disableOption}
        />
      ))}
    </Select>
  );
};

export const BucketLocationNameAndType = ({
  bucketName,
}: {
  bucketName: string;
}): string => {
  const { locationConstraint } = useBucketLocationConstraint({ bucketName });
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const locationInfos = useLocationAndStorageInfos({
    accountsLocationsEndpointsAdapter,
    locationName:
      locationConstraint.status === 'success' ? locationConstraint.value : '',
  });
  return `${
    locationConstraint.status === 'loading' ||
    locationConstraint.status === 'unknown'
      ? 'loading location'
      : locationConstraint.status === 'error'
      ? 'loading location constraint failed'
      : `${
          locationInfos.status === 'loading' ||
          locationInfos.status === 'unknown'
            ? 'loading locations'
            : locationInfos.status === 'error'
            ? 'loading locations failed'
            : `${locationInfos.value.nameAndShortType}`
        }
      `
  }`;
};

export const SourceBucketOption = ({
  bucketName,
  disableOption,
}: { bucketName: string } & DisableOptionProps) => {
  const { locationConstraint } = useBucketLocationConstraint({ bucketName });
  const { versionning } = useBucketVersionning({ bucketName });

  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const locationInfos = useLocationAndStorageInfos({
    accountsLocationsEndpointsAdapter,
    locationName:
      locationConstraint.status === 'success' ? locationConstraint.value : '',
  });
  const { tags } = useBucketTagging({ bucketName });
  const { showToast } = useToast();
  useEffect(() => {
    if (tags.status === 'error') {
      showToast({
        open: true,
        status: 'error',
        message:
          'Encountered issues loading bucket tagging, causing uncertainty about the source of Bucket. Please refresh the page.',
      });
    }
  }, [tags.status]);

  const isLoading =
    versionning.status === 'loading' ||
    locationInfos.status === 'loading' ||
    tags.status === 'loading';

  const isOptionDisabled = disableOption
    ? disableOption({
        isBucketVersionned:
          versionning.status === 'success' && versionning.value === 'Enabled',
        isReplicationSourceSupported:
          locationInfos.status === 'success' &&
          !locationInfos.value.storageOption?.supportsReplicationSource,
        isVeeamBucket:
          tags.status === 'success' &&
          !!tags.value?.[BUCKET_TAG_VEEAM_APPLICATION],
      })
    : { disabled: false, disabledMessage: undefined };

  return (
    <Select.Option
      value={bucketName}
      disabled={isLoading || isOptionDisabled.disabled}
      icon={isLoading && <Loader />}
      disabledReason={
        isLoading ? <>Loading...</> : isOptionDisabled.disabledMessage
      }
    >
      {`${bucketName} (${BucketLocationNameAndType({ bucketName })})`}
    </Select.Option>
  );
};
