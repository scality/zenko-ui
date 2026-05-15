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
        Resource: [...buckets.flatMap((bucket) => [`arn:aws:s3:::${bucket}/*`, `arn:aws:s3:::${bucket}`])],
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
        Resource: [...buckets.flatMap((bucket) => [`arn:aws:s3:::${bucket}/*`, `arn:aws:s3:::${bucket}`])],
      },
      {
        Effect: 'Allow',
        Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
        Resource: '*',
      },
    ],
  });

export const GET_KASTEN_POLICY = GET_VEEAM_POLICY;

export const GET_RUBRIK_POLICY = (buckets: string[], isImmutable: boolean) => {
  if (isImmutable) {
    return JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'GlobalPermission',
          Effect: 'Allow',
          Action: ['s3:ListAllMyBuckets'],
          Resource: '*',
        },
        {
          Sid: 'BucketLevel',
          Effect: 'Allow',
          Action: [
            's3:ListBucket',
            's3:ListBucketMultipartUploads',
            's3:GetBucketLocation',
            's3:GetBucketAcl',
            's3:GetBucketPolicy',
            's3:GetBucketVersioning',
            's3:GetBucketPublicAccessBlock',
            's3:GetBucketObjectLockConfiguration',
            's3:PutBucketObjectLockConfiguration',
          ],
          Resource: buckets.map((bucket) => `arn:aws:s3:::${bucket}`),
        },
        {
          Sid: 'ObjectLevel',
          Effect: 'Allow',
          Action: [
            's3:AbortMultipartUpload',
            's3:ListMultipartUploadParts',
            's3:PutObject',
            's3:GetObject',
            's3:DeleteObject',
            's3:RestoreObject',
            's3:PutObjectTagging',
            's3:GetObjectTagging',
            's3:PutObjectAcl',
            's3:GetObjectAcl',
            's3:GetObjectVersion',
            's3:DeleteObjectVersion',
            's3:GetObjectVersionTagging',
            's3:PutObjectVersionTagging',
            's3:PutObjectRetention',
            's3:GetObjectRetention',
            's3:PutObjectLegalHold',
            's3:GetObjectLegalHold',
            's3:BypassGovernanceRetention',
          ],
          Resource: buckets.map((bucket) => `arn:aws:s3:::${bucket}/*`),
        },
      ],
    });
  }

  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'RubrikPolicy',
        Effect: 'Allow',
        Action: [
          // defaultActions required for policy update fingerprinting
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetBucketLocation',
          's3:GetBucketVersioning',
          's3:GetBucketObjectLockConfiguration',
          // Rubrik-specific actions
          's3:AbortMultipartUpload',
          's3:ListMultipartUploadParts',
          's3:ListBucketMultipartUploads',
          's3:RestoreObject',
          's3:CreateBucket',
          's3:GetBucketAcl',
        ],
        Resource: buckets.flatMap((bucket) => [`arn:aws:s3:::${bucket}/*`, `arn:aws:s3:::${bucket}`]),
      },
      {
        Sid: 'RubrikListBuckets',
        Effect: 'Allow',
        Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
        Resource: '*',
      },
    ],
  });
};
