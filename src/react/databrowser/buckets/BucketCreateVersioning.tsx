import { Checkbox, FormGroup } from '@scality/core-ui';
import type { BucketCreateVersioningProps } from '@scality/data-browser-library';
import { useFormContext } from 'react-hook-form';
import { useWatchedLocation } from './useWatchedLocation';

export function BucketCreateVersioning({ isVersioning, isObjectLockEnabled }: BucketCreateVersioningProps) {
  const { watch, register } = useFormContext();
  const isAsyncNotification = watch('isAsyncNotification');

  const { isAzureOrGcp } = useWatchedLocation();

  const isDisabled = isObjectLockEnabled || isAsyncNotification || isAzureOrGcp;

  const helpText = isAzureOrGcp
    ? 'Selected Storage Location does not support versioning.'
    : isObjectLockEnabled || isAsyncNotification
      ? `Automatically activated when ${[
          isObjectLockEnabled && 'Object-lock',
          isAsyncNotification && 'Async Metadata updates',
        ]
          .filter(Boolean)
          .join(' or ')} is Enabled`
      : '';

  return (
    <FormGroup
      id="isVersioning"
      label="Enable Versioning"
      disabled={isDisabled}
      labelHelpTooltip={
        <ul>
          <li>
            Versioning keeps multiple versions of each objects in your bucket. You can restore deleted or overwritten
            objects as a result of unintended user actions or application failures.
          </li>
          <li>It's possible to enable and suspend versioning at the bucket level after the bucket creation.</li>
        </ul>
      }
      helpErrorPosition="bottom"
      help={helpText}
      content={
        <Checkbox
          id="isVersioning"
          disabled={isDisabled}
          {...register('isVersioning')}
        />
      }
    />
  );
}
