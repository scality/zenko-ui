import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';

export type BucketLocationConstraintPromiseResult = {
  locationConstraint: PromiseResult<string>;
};

export type BucketLatestUsedCapacityPromiseResult = {
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};

export type Bucket = BucketLocationConstraintPromiseResult & {
  name: string;
  creationDate: Date;
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};

export type BucketsPromiseResult = {
  buckets: PromiseResult<Bucket[]>;
};
