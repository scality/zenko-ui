import {
  LocationV1,
  Locationv1Details,
} from '../../../../js/managementClient/api';

export type LocationInfo = {
  id: string;
  name: string;
  type: LocationV1.LocationTypeEnum;
  // This looks terrible
  // `type` should be link to `Locationv1Details`
  details: Locationv1Details;
};

export interface ILocationsAdapter {
  listLocations(): Promise<LocationInfo[]>;
}
