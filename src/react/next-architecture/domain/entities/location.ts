import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';
import { LocationTypeKey } from '../../../../types/config';
import { Locationv1Details } from '../../../../js/managementClient/api';
import { LocationInfo } from '../../adapters/accounts-locations/ILocationsAdapter';
import { StorageOptionValues } from '../../../backend/location/LocationDetails';

export type Location = {
  id: string;
  name: string;
  type: LocationTypeKey;
  isTransient?: boolean;
  isCold?: boolean;
  details: Locationv1Details;
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};

export type LocationStorageInfos = {
  location?: LocationInfo;
  storageOption?: StorageOptionValues;
  nameAndShortType: string;
};

export type LocationsPromiseResult = {
  locations: PromiseResult<Record<string, Location>>;
};
