import {
  addBucketsToPolicy,
  GET_COMMVAULT_POLICY,
  GET_KASTEN_POLICY,
  GET_RUBRIK_POLICY,
  GET_VEEAM_POLICY,
  GET_VEEAM_VBO_POLICY,
  type PolicyDocument,
} from './ISVPolicy';

const BACKUP_BUCKET_ACTIONS = [
  's3:ListBucket',
  's3:GetBucketLocation',
  's3:GetBucketVersioning',
  's3:GetBucketObjectLockConfiguration',
];
const BACKUP_IMMUTABLE_BUCKET_ACTIONS = [
  's3:ListBucket',
  's3:ListBucketVersions',
  's3:GetBucketLocation',
  's3:GetBucketVersioning',
  's3:GetBucketObjectLockConfiguration',
];
const BACKUP_OBJECT_ACTIONS = ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'];
const BACKUP_IMMUTABLE_OBJECT_ACTIONS = [
  's3:PutObject',
  's3:GetObject',
  's3:DeleteObject',
  's3:GetObjectVersion',
  's3:DeleteObjectVersion',
  's3:GetObjectRetention',
  's3:PutObjectRetention',
  's3:GetObjectLegalHold',
  's3:PutObjectLegalHold',
];

const backupPolicy = (sidPrefix: string, bucketActions: string[], objectActions: string[]) => ({
  Version: '2012-10-17',
  Statement: [
    {
      Sid: `${sidPrefix}BucketAccess`,
      Effect: 'Allow',
      Action: bucketActions,
      Resource: 'arn:aws:s3:::bucketname',
    },
    {
      Sid: `${sidPrefix}ObjectAccess`,
      Effect: 'Allow',
      Action: objectActions,
      Resource: 'arn:aws:s3:::bucketname/*',
    },
    {
      Sid: `${sidPrefix}ListAllMyBuckets`,
      Effect: 'Allow',
      Action: 's3:ListAllMyBuckets',
      Resource: '*',
    },
  ],
});

// Policies published on the partner application pages of the ARTESCA documentation,
// for a bucket named "bucketname".
const DOCUMENTED_POLICIES = {
  commvault: {
    immutable: backupPolicy('Commvault', BACKUP_IMMUTABLE_BUCKET_ACTIONS, BACKUP_IMMUTABLE_OBJECT_ACTIONS),
    nonImmutable: backupPolicy('Commvault', BACKUP_BUCKET_ACTIONS, BACKUP_OBJECT_ACTIONS),
  },
  kasten: {
    immutable: backupPolicy('Kasten', BACKUP_IMMUTABLE_BUCKET_ACTIONS, BACKUP_IMMUTABLE_OBJECT_ACTIONS),
    nonImmutable: backupPolicy('Kasten', BACKUP_BUCKET_ACTIONS, BACKUP_OBJECT_ACTIONS),
  },
  // The Veeam Backup & Replication page has no least-privilege policy yet (RD-2007):
  // it keeps its actions, split by resource type like the other backup applications.
  veeamVBR: {
    immutable: backupPolicy('Veeam', BACKUP_IMMUTABLE_BUCKET_ACTIONS, BACKUP_IMMUTABLE_OBJECT_ACTIONS),
    nonImmutable: backupPolicy('Veeam', BACKUP_BUCKET_ACTIONS, BACKUP_OBJECT_ACTIONS),
  },
  veeamVBO: {
    immutable: backupPolicy(
      'Veeam',
      [
        's3:ListBucket',
        's3:ListBucketVersions',
        's3:ListBucketMultipartUploads',
        's3:GetBucketLocation',
        's3:GetBucketVersioning',
        's3:GetBucketObjectLockConfiguration',
      ],
      [
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
    ),
    nonImmutable: backupPolicy(
      'Veeam',
      [
        's3:ListBucket',
        's3:ListBucketMultipartUploads',
        's3:GetBucketLocation',
        's3:GetBucketVersioning',
        's3:GetBucketObjectLockConfiguration',
      ],
      [
        's3:PutObject',
        's3:GetObject',
        's3:DeleteObject',
        's3:AbortMultipartUpload',
        's3:ListMultipartUploadParts',
        's3:RestoreObject',
      ],
    ),
  },
  rubrik: {
    immutable: {
      Version: '2012-10-17',
      Statement: [
        { Sid: 'GlobalPermission', Effect: 'Allow', Action: ['s3:ListAllMyBuckets'], Resource: '*' },
        {
          Sid: 'BucketLevel',
          Effect: 'Allow',
          Action: [
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
          Resource: 'arn:aws:s3:::bucketname',
        },
        {
          Sid: 'ObjectLevel',
          Effect: 'Allow',
          Action: [
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
          Resource: 'arn:aws:s3:::bucketname/*',
        },
      ],
    },
    nonImmutable: {
      Version: '2012-10-17',
      Statement: [
        { Sid: 'GlobalPermission', Effect: 'Allow', Action: ['s3:ListAllMyBuckets'], Resource: '*' },
        {
          Sid: 'BucketLevel',
          Effect: 'Allow',
          Action: [
            's3:CreateBucket',
            's3:GetBucketAcl',
            's3:GetBucketLocation',
            's3:ListBucket',
            's3:ListBucketMultipartUploads',
          ],
          Resource: 'arn:aws:s3:::bucketname',
        },
        {
          Sid: 'ObjectLevel',
          Effect: 'Allow',
          Action: [
            's3:AbortMultipartUpload',
            's3:DeleteObject',
            's3:GetObject',
            's3:ListMultipartUploadParts',
            's3:PutObject',
            's3:RestoreObject',
          ],
          Resource: 'arn:aws:s3:::bucketname/*',
        },
      ],
    },
  },
};

const POLICY_BUILDERS = {
  commvault: GET_COMMVAULT_POLICY,
  kasten: GET_KASTEN_POLICY,
  veeamVBR: GET_VEEAM_POLICY,
  veeamVBO: GET_VEEAM_VBO_POLICY,
  rubrik: GET_RUBRIK_POLICY,
};

const BUILDER_CASES = Object.entries(POLICY_BUILDERS).flatMap(([application, getPolicy]) => [
  { application, variant: 'immutable' as const, isImmutable: true, getPolicy },
  { application, variant: 'nonImmutable' as const, isImmutable: false, getPolicy },
]);

const toArray = (value: string | string[]) => (Array.isArray(value) ? value : [value]);

const withResourcesAsArrays = (policy: PolicyDocument) => ({
  ...policy,
  Statement: policy.Statement.map((statement) => ({
    ...statement,
    Resource: statement.Resource === '*' ? '*' : toArray(statement.Resource),
  })),
});

describe('ISV assistant policies', () => {
  it.each(BUILDER_CASES)('$application $variant policy matches the documented policy', ({
    application,
    variant,
    isImmutable,
    getPolicy,
  }) => {
    const policy = JSON.parse(getPolicy(['bucketname'], isImmutable));

    expect(policy).toEqual(withResourcesAsArrays(DOCUMENTED_POLICIES[application][variant]));
  });

  it.each(BUILDER_CASES)('$application $variant policy never grants s3:ListBucket on every bucket', ({
    isImmutable,
    getPolicy,
  }) => {
    const policy: PolicyDocument = JSON.parse(getPolicy(['bucket-1', 'bucket-2'], isImmutable));

    const listBucketResources = policy.Statement.filter((statement) =>
      toArray(statement.Action).includes('s3:ListBucket'),
    ).flatMap((statement) => toArray(statement.Resource));

    expect(listBucketResources).toEqual(['arn:aws:s3:::bucket-1', 'arn:aws:s3:::bucket-2']);
  });

  it.each(BUILDER_CASES)('$application $variant policy scopes every statement to all the buckets', ({
    isImmutable,
    getPolicy,
  }) => {
    const policy: PolicyDocument = JSON.parse(getPolicy(['bucket-1', 'bucket-2'], isImmutable));

    const scopedResources = policy.Statement.filter((statement) => statement.Resource !== '*').map((statement) =>
      toArray(statement.Resource),
    );

    expect(scopedResources).toEqual([
      ['arn:aws:s3:::bucket-1', 'arn:aws:s3:::bucket-2'],
      ['arn:aws:s3:::bucket-1/*', 'arn:aws:s3:::bucket-2/*'],
    ]);
  });
});

describe('addBucketsToPolicy', () => {
  const generatedPolicy = (buckets: string[]) => JSON.parse(GET_COMMVAULT_POLICY(buckets, false));

  it('adds the new buckets to the bucket and object statements of a least-privilege policy', () => {
    const updated = addBucketsToPolicy(
      generatedPolicy(['old-bucket']),
      ['new-bucket'],
      generatedPolicy(['new-bucket']),
    );

    expect(updated).toEqual(generatedPolicy(['old-bucket', 'new-bucket']));
  });

  it('gives a new bucket object access in a Rubrik immutable policy created by a previous release', () => {
    const previousRubrikPolicy: PolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        { Sid: 'GlobalPermission', Effect: 'Allow', Action: ['s3:ListAllMyBuckets'], Resource: '*' },
        { Sid: 'BucketLevel', Effect: 'Allow', Action: ['s3:ListBucket'], Resource: ['arn:aws:s3:::old-rubrik-0'] },
        { Sid: 'ObjectLevel', Effect: 'Allow', Action: ['s3:PutObject'], Resource: ['arn:aws:s3:::old-rubrik-0/*'] },
      ],
    };

    const updated = addBucketsToPolicy(
      previousRubrikPolicy,
      ['new-rubrik-1'],
      JSON.parse(GET_RUBRIK_POLICY(['new-rubrik-1'], true)),
    );

    expect(updated.Statement).toEqual([
      previousRubrikPolicy.Statement[0],
      { ...previousRubrikPolicy.Statement[1], Resource: ['arn:aws:s3:::old-rubrik-0', 'arn:aws:s3:::new-rubrik-1'] },
      {
        ...previousRubrikPolicy.Statement[2],
        Resource: ['arn:aws:s3:::old-rubrik-0/*', 'arn:aws:s3:::new-rubrik-1/*'],
      },
    ]);
  });

  it('keeps the scope of a policy created before the least-privilege change', () => {
    const legacyPolicy: PolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:GetObject', 's3:GetBucketLocation'],
          Resource: ['arn:aws:s3:::old-bucket/*', 'arn:aws:s3:::old-bucket'],
        },
        { Effect: 'Allow', Action: ['s3:ListAllMyBuckets', 's3:ListBucket'], Resource: '*' },
      ],
    };

    const updated = addBucketsToPolicy(legacyPolicy, ['new-bucket'], generatedPolicy(['new-bucket']));

    expect(updated.Statement).toEqual([
      {
        ...legacyPolicy.Statement[0],
        Resource: [
          'arn:aws:s3:::old-bucket/*',
          'arn:aws:s3:::old-bucket',
          'arn:aws:s3:::new-bucket',
          'arn:aws:s3:::new-bucket/*',
        ],
      },
      legacyPolicy.Statement[1],
    ]);
  });

  it('does not add a bucket the policy already covers', () => {
    const policy = generatedPolicy(['bucket']);

    expect(addBucketsToPolicy(policy, ['bucket'], generatedPolicy(['bucket']))).toEqual(policy);
  });

  it('adds a bucket only in the ARN form a statement already uses', () => {
    const policy: PolicyDocument = {
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::old-bucket/*' }],
    };

    const updated = addBucketsToPolicy(policy, ['new-bucket'], generatedPolicy(['new-bucket']));

    expect(updated.Statement[0].Resource).toEqual(['arn:aws:s3:::old-bucket/*', 'arn:aws:s3:::new-bucket/*']);
  });

  it('adds each new bucket once', () => {
    const updated = addBucketsToPolicy(
      generatedPolicy(['old-bucket']),
      ['new-bucket', 'new-bucket'],
      generatedPolicy(['new-bucket']),
    );

    expect(updated).toEqual(generatedPolicy(['old-bucket', 'new-bucket']));
  });

  it('handles a policy whose Statement is a single statement', () => {
    const policy = {
      Version: '2012-10-17',
      Statement: { Effect: 'Allow', Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::old-bucket/*'] },
    };

    const updated = addBucketsToPolicy(policy, ['new-bucket'], generatedPolicy(['new-bucket']));

    expect(updated.Statement).toEqual([
      { ...policy.Statement, Resource: ['arn:aws:s3:::old-bucket/*', 'arn:aws:s3:::new-bucket/*'] },
    ]);
  });

  it('leaves Deny statements untouched', () => {
    const denyStatement = {
      Effect: 'Deny',
      Action: ['s3:DeleteObject'],
      Resource: ['arn:aws:s3:::old-bucket/*'],
    };
    const policy: PolicyDocument = {
      ...generatedPolicy(['old-bucket']),
      Statement: [...generatedPolicy(['old-bucket']).Statement, denyStatement],
    };

    const updated = addBucketsToPolicy(policy, ['new-bucket'], generatedPolicy(['new-bucket']));

    expect(updated.Statement[3]).toEqual(denyStatement);
  });

  it('appends the bucket statements of the generated policy when no statement is scoped to a bucket', () => {
    const policy: PolicyDocument = {
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Action: 's3:ListAllMyBuckets', Resource: '*' }],
    };
    const generated = generatedPolicy(['new-bucket']);

    const updated = addBucketsToPolicy(policy, ['new-bucket'], generated);

    expect(updated.Statement).toEqual([policy.Statement[0], generated.Statement[0], generated.Statement[1]]);
  });
});
