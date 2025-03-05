export const immutableActions = [
  's3:ListBucketVersions',
  's3:GetObjectVersion',
  's3:GetObjectRetention',
  's3:GetObjectLegalHold',
  's3:PutObjectRetention',
  's3:PutObjectLegalHold',
  's3:DeleteObjectVersion',
];

export const defaultActions = [
  's3:GetObject',
  's3:PutObject',
  's3:DeleteObject',
  's3:GetBucketLocation',
  's3:GetBucketVersioning',
  's3:GetBucketObjectLockConfiguration',
];

const getAllowedActions = (isImmutable: boolean) => {
  return [...defaultActions, ...(isImmutable ? immutableActions : [])];
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
          ...buckets.flatMap((bucket) => [
            `arn:aws:s3:::${bucket}/*`,
            `arn:aws:s3:::${bucket}`,
          ]),
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
export const GET_COMMVAULT_POLICY = (buckets: string[], isImmutable: boolean) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: getAllowedActions(isImmutable),
        Resource: [
          ...buckets.flatMap((bucket) => [
            `arn:aws:s3:::${bucket}/*`,
            `arn:aws:s3:::${bucket}`,
          ]),
        ],
      },
      {
        Effect: 'Allow',
        Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
        Resource: '*',
      },
    ],
  });
