import { Locationv1Details } from '../../../../js/managementClient/api';
import { LocationTypeKey } from '../../../../types/config';

export type LocationInfo = {
  id: string;
  name: string;
  type: LocationTypeKey;
  // This looks terrible
  // `type` should be link to `Locationv1Details`
  details: Locationv1Details;
};

export interface ILocationsAdapter {
  listLocations(): Promise<LocationInfo[]>;
}
