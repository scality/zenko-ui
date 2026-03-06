import { LocationType, Locationv1Details } from '../../../../js/managementClient/api';

export type LocationInfo = {
  id: string;
  name: string;
  type: LocationType;
  isTransient?: boolean;
  isCold?: boolean;
  isBuiltin?: boolean;
  // This looks terrible
  // `type` should be link to `Locationv1Details`
  details: Locationv1Details;
};

export interface ILocationsAdapter {
  listLocations(): Promise<LocationInfo[]>;
}
