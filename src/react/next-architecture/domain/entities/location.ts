import type { Locationv1Details } from '../../../../js/managementClient/api';
import type { LocationTypeKey } from '../../../../types/config';
import type { StorageOptionValues } from '../../../locations/LocationDetails';
import type { LocationInfo } from '../../adapters/accounts-locations/ILocationsAdapter';
import type { LatestUsedCapacity } from './metrics';
import type { PromiseResult } from './promise';

export type Location = {
  id: string;
  name: string;
  type: LocationTypeKey;
  isTransient?: boolean;
  isCold?: boolean;
  isBuiltin?: boolean;
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
