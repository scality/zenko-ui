import { FormGroup } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { useFormContext } from 'react-hook-form';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';

function isCRRLocationType(type: string): boolean {
  return type === 'location-scality-crr-v1';
}

/**
 * ARTESCA-specific destination fields for the replication form.
 *
 * - CRR locations: shows a "Target Bucket Name" input (bucket must be specified
 *   because it's not pre-configured in the CRR location definition).
 * - Non-CRR locations: renders nothing — the bucket is already defined in the
 *   location configuration, and all ARTESCA targets are external (no same-account
 *   concept).
 */
export function ReplicationCRRDestinationFields() {
  const {
    watch,
    register,
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

  if (!isCRR) {
    return null;
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
