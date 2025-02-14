import { useMutation } from 'react-query';
import {
  useAttachPolicyToUserMutation,
  useCreatePolicyMutation,
  usePutBucketTaggingMutation,
} from '../../../js/mutations';

import { useCreateBucket } from '../../next-architecture/domain/business/buckets';
import {
  GET_VEEAM_IMMUTABLE_POLICY,
  GET_VEEAM_NON_IMMUTABLE_POLICY,
} from '../constants';

const GET_COMMVAULT_POLICY = (buckets: string[], isImmutable: boolean) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: isImmutable
          ? [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:GetBucketLocation',
              's3:GetBucketVersioning',
              's3:GetBucketObjectLockConfiguration',
              's3:ListBucketVersions',
              's3:GetObjectVersion',
              's3:GetObjectRetention',
              's3:GetObjectLegalHold',
              's3:PutObjectRetention',
              's3:PutObjectLegalHold',
              's3:DeleteObjectVersion',
            ]
          : [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:GetBucketLocation',
              's3:GetBucketVersioning',
              's3:GetBucketObjectLockConfiguration',
            ],
        Resource: [
          ...buckets
            .map((bucket) => [
              `arn:aws:s3:::${bucket}/*`,
              `arn:aws:s3:::${bucket}`,
            ])
            .flat(),
        ],
      },
      {
        Effect: 'Allow',
        Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
        Resource: '*',
      },
    ],
  });
export const GET_ISV_POLICY = (
  buckets: string[],
  application: string,
  enableImmutableBackup: boolean,
) => {
  switch (application) {
    // case 'Veeam':
    //   return enableImmutableBackup
    //     ? GET_VEEAM_IMMUTABLE_POLICY(bucketName)
    //     : GET_VEEAM_NON_IMMUTABLE_POLICY(bucketName);
    case 'Commvault':
      return GET_COMMVAULT_POLICY(buckets, enableImmutableBackup);
    default:
      return 'Default Policy';
  }
};

export const useBucketMutation = (bucket) => {
  const { mutate: createBucket, error, data } = useCreateBucket();

  return useMutation({
    mutationFn: async (variables) => {
      console.log('DEBUG useBucketMutation in mutationFn', variables);
      const createBucketArray = createBucket({
        ObjectLockEnabledForBucket: variables.ObjectLockEnabledForBucket,
        Bucket: bucket.name,
      });

      return createBucketArray;
    },
  });
};
