import { Checkbox, FormGroup } from '@scality/core-ui';
import { useEffect, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { XDM_FEATURE } from '../../../js/config';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { useWatchedLocation } from './useWatchedLocation';

const helpNonAsyncLocation =
  'Selected Storage Location does not support Async Metadata updates.';
const helpAsyncNotification =
  'Pause/resume Async Metadata updates is handled at the location level.';

export function BucketCreateLocationEffects() {
  const { watch, setValue, control } = useFormContext();
  const isObjectLockEnabled = watch('isObjectLockEnabled');
  const isAsyncNotification = watch('isAsyncNotification');

  const { locationConstraint, isAzureOrGcp, isIngest } =
    useWatchedLocation();

  const prevLocationRef = useRef(locationConstraint);

  useEffect(() => {
    const locationChanged = prevLocationRef.current !== locationConstraint;
    prevLocationRef.current = locationConstraint;

    if (locationChanged || !isIngest) {
      setValue('isAsyncNotification', false);
    }

    if (isAzureOrGcp) {
      setValue('isVersioning', false);
    } else if (isAsyncNotification && isIngest && !locationChanged) {
      setValue('isVersioning', true);
    } else if (isObjectLockEnabled) {
      setValue('isVersioning', true);
    }
  }, [locationConstraint, isAzureOrGcp, isAsyncNotification, isIngest, isObjectLockEnabled, setValue]);

  const { features } = useConfig();
  const showXDM = features.includes(XDM_FEATURE);

  return (
    <>
      {showXDM && (
        <FormGroup
          id="isAsyncNotification"
          label="Async Metadata updates"
          help={
            locationConstraint && isIngest && isAsyncNotification
              ? helpAsyncNotification
              : locationConstraint && !isIngest
                ? helpNonAsyncLocation
                : ''
          }
          helpErrorPosition="bottom"
          disabled={!isIngest}
          labelHelpTooltip="Enabling Async Metadata updates automatically activates Versioning for the bucket, and you won't be able to suspend Versioning."
          content={
            <Controller
              name="isAsyncNotification"
              control={control}
              render={({ field: { value, onChange, ref } }) => (
                <Checkbox
                  id="isAsyncNotification"
                  disabled={!isIngest}
                  label={value ? 'Enabled' : 'Disabled'}
                  checked={!!value}
                  onChange={(e) => onChange(e.target.checked)}
                  ref={ref}
                />
              )}
            />
          }
        />
      )}
    </>
  );
}
