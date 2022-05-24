import { LocationDetails } from '../../../../types/config';
import { InstanceStateSnapshot } from '../../../../types/stats';

export * from './storageOptions';
export { default as LocationDetails } from './LocationDetails';

export type LocationDetailsFormProps = {
    editingExisting?: boolean;
    details: LocationDetails;
    onChange: (details: LocationDetails) => void;
    locationType: string;
    capabilities?: Pick<InstanceStateSnapshot, 'capabilities'>;
  };
