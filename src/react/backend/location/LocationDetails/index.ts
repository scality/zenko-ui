import { Locationv1Details } from '../../../../js/managementClient/api';
import { LocationTypeKey } from '../../../../types/config';
import { InstanceStateSnapshot } from '../../../../types/stats';

export * from './storageOptions';
export { default as LocationDetails } from './LocationDetails';

export type LocationDetailsFormProps = {
  editingExisting?: boolean;
  details: Locationv1Details;
  onChange: (details: Locationv1Details) => void;
  locationType: LocationTypeKey;
  capabilities?: Pick<InstanceStateSnapshot, 'capabilities'>;
};
