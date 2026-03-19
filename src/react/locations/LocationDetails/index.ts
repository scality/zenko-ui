import type { Locationv1Details } from '../../../js/managementClient/api';
import type { LocationTypeKey } from '../../../types/config';
import type { InstanceStateSnapshot } from '../../../types/stats';

export { default as LocationDetails } from './LocationDetails';
export * from './storageOptions';

export type LocationDetailsFormProps = {
  editingExisting?: boolean;
  details: Locationv1Details;
  onChange: (details: Locationv1Details) => void;
  locationType: LocationTypeKey;
  capabilities?: Pick<InstanceStateSnapshot, 'capabilities'>;
};
