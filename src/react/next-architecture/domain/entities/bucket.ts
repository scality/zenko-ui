import { ObjectLockConfiguration } from 'aws-sdk/clients/s3';
import { LatestUsedCapacity } from './metrics';
import { PromiseResult } from './promise';

export type BucketVersionningPromiseResult = {
  versionning: PromiseResult<'Enabled' | 'Disabled' | 'Suspended'>;
};

export type BucketDefaultRetentionPromiseResult = {
  defaultRetention: PromiseResult<ObjectLockConfiguration>;
};

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

export type BucketTaggingPromiseResult = {
  tags: PromiseResult<Record<string, string>>;
};
