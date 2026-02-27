import { FormGroup } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { DefaultReplicationDestinationFields } from '@scality/data-browser-library';
import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';

function isCRRLocationType(type: string): boolean {
  return type === 'location-scality-crr-v1';
}

export function ReplicationCRRDestinationFields() {
  const {
    watch,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<{ storageClass: string; targetBucket: string }>();
  const storageClass = watch('storageClass');

  const adapter = useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter: adapter,
  });

  const locations = accountsLocationsAndEndpoints?.locations ?? [];
  const selectedLocation = locations.find((l) => l.name === storageClass);
  const isCRR =
    !!selectedLocation &&
    isCRRLocationType(selectedLocation.type as unknown as string);

  const prevIsCRRRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (prevIsCRRRef.current !== undefined && prevIsCRRRef.current !== isCRR) {
      setValue('targetBucket', '', { shouldValidate: true });
    }
    prevIsCRRRef.current = isCRR;
  }, [isCRR, setValue]);

  if (!isCRR) {
    return <DefaultReplicationDestinationFields />;
  }

  return (
    <FormGroup
      label="Target Bucket Name"
      id="targetBucket"
      direction="horizontal"
      error={errors?.targetBucket?.message}
      helpErrorPosition="bottom"
      required
      labelHelpTooltip="Name of the bucket on the remote CRR destination where objects will be replicated. The bucket must already exist."
      content={
        <Input
          id="targetBucket"
          placeholder="my-destination-bucket"
          {...register('targetBucket')}
        />
      }
    />
  );
}
