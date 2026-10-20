export type PolicyStatement = {
  Sid?: string;
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
};

export type PolicyDocument = {
  Version: string;
  Statement: PolicyStatement[];
};

type ActionsByVariant = Record<'immutable' | 'nonImmutable', { bucket: string[]; object: string[] }>;

const BACKUP_ACTIONS: ActionsByVariant = {
  immutable: {
    bucket: [
      's3:ListBucket',
      's3:ListBucketVersions',
      's3:GetBucketLocation',
      's3:GetBucketVersioning',
      's3:GetBucketObjectLockConfiguration',
    ],
    object: [
      's3:PutObject',
      's3:GetObject',
      's3:DeleteObject',
      's3:GetObjectVersion',
      's3:DeleteObjectVersion',
      's3:GetObjectRetention',
      's3:PutObjectRetention',
      's3:GetObjectLegalHold',
      's3:PutObjectLegalHold',
    ],
  },
  nonImmutable: {
    bucket: ['s3:ListBucket', 's3:GetBucketLocation', 's3:GetBucketVersioning', 's3:GetBucketObjectLockConfiguration'],
    object: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
  },
};

// Veeam Backup for Microsoft 365 follows Veeam's own S3 permission list for that product,
// which differs from the Backup & Replication one.
const VEEAM_VBO_ACTIONS: ActionsByVariant = {
  immutable: {
    bucket: [
      's3:ListBucket',
      's3:ListBucketVersions',
      's3:ListBucketMultipartUploads',
      's3:GetBucketLocation',
      's3:GetBucketVersioning',
      's3:GetBucketObjectLockConfiguration',
    ],
    object: [
      's3:PutObject',
      's3:GetObject',
      's3:DeleteObject',
      's3:GetObjectVersion',
      's3:DeleteObjectVersion',
      's3:GetObjectRetention',
      's3:PutObjectRetention',
      's3:AbortMultipartUpload',
      's3:ListMultipartUploadParts',
      's3:RestoreObject',
    ],
  },
  nonImmutable: {
    bucket: [
      's3:ListBucket',
      's3:ListBucketMultipartUploads',
      's3:GetBucketLocation',
      's3:GetBucketVersioning',
      's3:GetBucketObjectLockConfiguration',
    ],
    object: [
      's3:PutObject',
      's3:GetObject',
      's3:DeleteObject',
      's3:AbortMultipartUpload',
      's3:ListMultipartUploadParts',
      's3:RestoreObject',
    ],
  },
};

// The immutable set is Rubrik's own object-lock set, validated in the ISV lab (ISVD-796). Its short-form
// s3:Get/PutObjectLockConfiguration names come from Rubrik's published policy and are kept as is.
const RUBRIK_ACTIONS: ActionsByVariant = {
  immutable: {
    bucket: [
      's3:CreateBucket',
      's3:GetBucketAcl',
      's3:GetBucketLocation',
      's3:GetBucketObjectLockConfiguration',
      's3:GetBucketVersioning',
      's3:ListBucket',
      's3:ListBucketMultipartUploads',
      's3:ListBucketVersions',
      's3:PutBucketObjectLockConfiguration',
      's3:PutBucketVersioning',
    ],
    object: [
      's3:AbortMultipartUpload',
      's3:DeleteObject',
      's3:DeleteObjectVersion',
      's3:GetObject',
      's3:GetObjectAttributes',
      's3:GetObjectLockConfiguration',
      's3:GetObjectRetention',
      's3:GetObjectVersion',
      's3:ListMultipartUploadParts',
      's3:PutObject',
      's3:PutObjectLockConfiguration',
      's3:PutObjectRetention',
      's3:RestoreObject',
    ],
  },
  nonImmutable: {
    bucket: [
      's3:CreateBucket',
      's3:GetBucketAcl',
      's3:GetBucketLocation',
      's3:ListBucket',
      's3:ListBucketMultipartUploads',
    ],
    object: [
      's3:AbortMultipartUpload',
      's3:DeleteObject',
      's3:GetObject',
      's3:ListMultipartUploadParts',
      's3:PutObject',
      's3:RestoreObject',
    ],
  },
};

const bucketArns = (buckets: string[]) => buckets.map((bucket) => `arn:aws:s3:::${bucket}`);
const objectArns = (buckets: string[]) => buckets.map((bucket) => `arn:aws:s3:::${bucket}/*`);

const getActions = (actions: ActionsByVariant, isImmutable: boolean) =>
  isImmutable ? actions.immutable : actions.nonImmutable;

const getBackupPolicy = (sidPrefix: string, actions: ActionsByVariant) => (buckets: string[], isImmutable: boolean) => {
  const { bucket, object } = getActions(actions, isImmutable);

  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      { Sid: `${sidPrefix}BucketAccess`, Effect: 'Allow', Action: bucket, Resource: bucketArns(buckets) },
      { Sid: `${sidPrefix}ObjectAccess`, Effect: 'Allow', Action: object, Resource: objectArns(buckets) },
      { Sid: `${sidPrefix}ListAllMyBuckets`, Effect: 'Allow', Action: 's3:ListAllMyBuckets', Resource: '*' },
    ],
  });
};

export const GET_VEEAM_POLICY = getBackupPolicy('Veeam', BACKUP_ACTIONS);
export const GET_VEEAM_VBO_POLICY = getBackupPolicy('Veeam', VEEAM_VBO_ACTIONS);
export const GET_COMMVAULT_POLICY = getBackupPolicy('Commvault', BACKUP_ACTIONS);
export const GET_KASTEN_POLICY = getBackupPolicy('Kasten', BACKUP_ACTIONS);

export const GET_RUBRIK_POLICY = (buckets: string[], isImmutable: boolean) => {
  const { bucket, object } = getActions(RUBRIK_ACTIONS, isImmutable);

  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      { Sid: 'GlobalPermission', Effect: 'Allow', Action: ['s3:ListAllMyBuckets'], Resource: '*' },
      { Sid: 'BucketLevel', Effect: 'Allow', Action: bucket, Resource: bucketArns(buckets) },
      { Sid: 'ObjectLevel', Effect: 'Allow', Action: object, Resource: objectArns(buckets) },
    ],
  });
};

const BUCKET_ARN = /^arn:aws:s3:::[^/*]+$/;
const OBJECT_ARN = /^arn:aws:s3:::[^/*]+\/\*$/;

const toArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

const isBucketScoped = (statement: PolicyStatement) =>
  statement.Effect === 'Allow' &&
  toArray(statement.Resource ?? []).some((resource) => BUCKET_ARN.test(resource) || OBJECT_ARN.test(resource));

/**
 * Grants the new buckets the access the policy already grants to its buckets: each statement
 * scoped to buckets gets the new buckets in the same ARN forms, so the scope of an existing
 * policy never changes, whichever version of the assistant created it.
 */
export const addBucketsToPolicy = (
  policy: Omit<PolicyDocument, 'Statement'> & { Statement: PolicyStatement | PolicyStatement[] },
  buckets: string[],
  generatedPolicy: PolicyDocument,
): PolicyDocument => {
  const statements = toArray(policy.Statement);
  const newBuckets = [...new Set(buckets)];

  if (!statements.some(isBucketScoped)) {
    return { ...policy, Statement: [...statements, ...generatedPolicy.Statement.filter(isBucketScoped)] };
  }

  return {
    ...policy,
    Statement: statements.map((statement) => {
      if (!isBucketScoped(statement)) {
        return statement;
      }
      const resources = toArray(statement.Resource);
      const missingResources = [
        ...(resources.some((resource) => BUCKET_ARN.test(resource)) ? bucketArns(newBuckets) : []),
        ...(resources.some((resource) => OBJECT_ARN.test(resource)) ? objectArns(newBuckets) : []),
      ].filter((resource) => !resources.includes(resource));

      return missingResources.length ? { ...statement, Resource: [...resources, ...missingResources] } : statement;
    }),
  };
};
