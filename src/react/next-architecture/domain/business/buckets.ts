import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import {
  BucketLatestUsedCapacityPromiseResult,
  BucketLocationConstraintPromiseResult,
  BucketsPromiseResult,
} from '../entities/bucket';

/**
 * The hook returns the full list of buckets plus the locations and metrics of the first 20 buckets.
 */
export const useListBucketsForCurrentAccount = ({
  metricsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
}): BucketsPromiseResult => {
  throw new Error('Method not implemented.');
};

/**
 * The hook returns the location constraint for a specific bucket.
 * It will be called within the Table Cell on demande.
 * @param bucketName name of the bucket
 */
export const useBucketLocationConstraint = ({
  bucketName,
}: {
  bucketName: string;
}): BucketLocationConstraintPromiseResult => {
  throw new Error('Method not implemented.');
};

/**
 * The hook returns the latest used capacity for a specific bucket.
 * @param bucketName name of the bucket
 */
export const useBucketLatestUsedCapacity = ({
  metricsAdapter,
  bucketName,
}: {
  metricsAdapter: IMetricsAdapter;
  bucketName: string;
}): BucketLatestUsedCapacityPromiseResult => {
  throw new Error('Method not implemented.');
};
