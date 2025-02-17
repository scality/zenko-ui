const getAllowedActions = (isImmutable: boolean) => {
  return isImmutable
    ? [
        's3:GetBucketLocation',
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
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
        's3:PutObject',
        's3:GetObject',
        's3:DeleteObject',
        's3:GetBucketLocation',
        's3:GetBucketVersioning',
        's3:GetBucketObjectLockConfiguration',
      ];
};

export const GET_VEEAM_POLICY = (buckets: string[], isImmutable: boolean) => {
  const Sid0 = isImmutable ? 'VisualEditor0' : 'SecureBucketPolicy0';
  const Sid1 = isImmutable ? 'VisualEditor1' : 'SecureBucketPolicy1';

  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: Sid0,
        Effect: 'Allow',
        Action: getAllowedActions(isImmutable),
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
        Sid: Sid1,
        Effect: 'Allow',
        Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
        Resource: '*',
      },
    ],
  });
};
const GET_COMMVAULT_POLICY = (buckets: string[], isImmutable: boolean) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: getAllowedActions(isImmutable),
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
  console.log('DEBUG GET_ISV_POLICY', {
    buckets,
    application,
    enableImmutableBackup,
  });

  switch (application) {
    case 'Veeam':
      return GET_VEEAM_POLICY(buckets, enableImmutableBackup);
    case 'COMMVAULT':
      return GET_COMMVAULT_POLICY(buckets, enableImmutableBackup);
    default:
      return 'Default Policy';
  }
};
