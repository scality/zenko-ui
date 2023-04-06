import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';

type Location = {
  id: string;
  name: string;
  type: string;
  usedCapacity: PromiseResult<LatestUsedCapacity>;
  targetBucket?: string;
};

export type LocationsPromiseResult = {
  locations: PromiseResult<Location[]>;
};
