import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';
import { LocationTypeKey } from '../../../../types/config';
import { Locationv1Details } from '../../../../js/managementClient/api';

export type Location = {
  id: string;
  name: string;
  type: LocationTypeKey;
  details: Locationv1Details;
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};

export type LocationsPromiseResult = {
  locations: PromiseResult<Record<string, Location>>;
};
