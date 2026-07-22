import Joi from 'joi';
import type { LocationTypeKey } from '../../types/config';

const NAME_PATTERN = /^[a-z0-9-]+$/;

const nameField = Joi.string().required().max(63).pattern(NAME_PATTERN).messages({
  'string.empty': 'Location name is required',
  'string.pattern.base': 'Use only lowercase letters, numbers, and dashes.',
  'string.max': 'Location name must be at most 63 characters.',
});

const reqStr = (label: string) =>
  Joi.string()
    .required()
    .messages({ 'string.empty': `${label} is required`, 'any.required': `${label} is required` });

const editableSecret = (label: string, isEdit: boolean) => (isEdit ? Joi.string().allow('').optional() : reqStr(label));

const urlField = (label: string) =>
  Joi.string()
    .required()
    .custom((value: string, helpers) => {
      try {
        new URL(value);
        return value;
      } catch {
        return helpers.error('any.invalid');
      }
    })
    .messages({
      'string.empty': `${label} is required`,
      'any.required': `${label} is required`,
      'any.invalid': `${label} must be a valid URL`,
    });

const httpUrlField = (label: string) =>
  Joi.string()
    .required()
    .custom((value: string, helpers) => {
      try {
        const url = new URL(value);
        if (!url.protocol.startsWith('http')) return helpers.error('any.invalid');
        return value;
      } catch {
        return helpers.error('any.invalid');
      }
    })
    .messages({
      'string.empty': `${label} is required`,
      'any.required': `${label} is required`,
      'any.invalid': `${label} must be a valid HTTP or HTTPS URL`,
    });

const nonEmptyListField = (label: string) =>
  Joi.array()
    .items(Joi.string().allow(''))
    .has(Joi.string().min(1))
    .required()
    .messages({
      'array.hasUnknown': `${label} is required`,
      'array.has': `${label} is required`,
      'array.base': `${label} is required`,
      'any.required': `${label} is required`,
    });

const awsS3Details = (isEdit: boolean) =>
  Joi.object({
    accessKey: reqStr('Access Key'),
    secretKey: editableSecret('Secret Key', isEdit),
    bucketName: reqStr('Target Bucket Name'),
  }).unknown(true);

const awsCustomDetails = (isEdit: boolean, endpointRequired: boolean) =>
  Joi.object({
    accessKey: reqStr('Access Key'),
    secretKey: editableSecret('Secret Key', isEdit),
    bucketName: reqStr('Target Bucket Name'),
    endpoint: endpointRequired ? urlField('Endpoint') : Joi.string().allow('').optional(),
  }).unknown(true);

const gcpDetails = (isEdit: boolean) =>
  Joi.object({
    accessKey: reqStr('GCP Access Key'),
    secretKey: editableSecret('GCP Secret Key', isEdit),
    bucketName: reqStr('Target Bucket Name'),
    mpuBucketName: reqStr('Target Bucket for Multi-part Uploads'),
  }).unknown(true);

const wasabiDetails = (isEdit: boolean) =>
  Joi.object({
    accessKey: reqStr('Wasabi Access Key'),
    secretKey: editableSecret('Wasabi Secret Key', isEdit),
    bucketName: reqStr('Wasabi Target Bucket Name'),
    endpoint: Joi.string().allow('').optional(),
  }).unknown(true);

const doSpacesDetails = (isEdit: boolean) =>
  Joi.object({
    accessKey: reqStr('Spaces Access Key'),
    secretKey: editableSecret('Spaces Secret Key', isEdit),
    bucketName: reqStr('Target Space Name'),
    endpoint: urlField('Endpoint'),
  }).unknown(true);

const oracleDetails = (isEdit: boolean) =>
  Joi.object({
    accessKey: reqStr('Access Key'),
    secretKey: editableSecret('Secret Key', isEdit),
    bucketName: reqStr('Target Bucket Name'),
    endpoint: urlField('Endpoint'),
  }).unknown(true);

const azureAuth = (isEdit: boolean) =>
  Joi.alternatives().conditional('.type', {
    switch: [
      {
        is: 'location-azure-shared-key',
        then: Joi.object({
          type: Joi.valid('location-azure-shared-key').required(),
          accountName: reqStr('Storage Account Name'),
          accountKey: editableSecret('Storage Account Key', isEdit),
        }).unknown(true),
      },
      {
        is: 'location-azure-client-secret',
        then: Joi.object({
          type: Joi.valid('location-azure-client-secret').required(),
          tenantId: reqStr('Tenant ID'),
          clientId: reqStr('Client ID'),
          clientKey: editableSecret('Client Secret', isEdit),
        }).unknown(true),
      },
      {
        is: 'location-azure-shared-access-signature',
        then: Joi.object({
          type: Joi.valid('location-azure-shared-access-signature').required(),
          storageSasToken: editableSecret('SAS Token', isEdit),
        }).unknown(true),
      },
    ],
    otherwise: Joi.any(),
  });

const azureDetails = (isEdit: boolean) =>
  Joi.object({
    endpoint: urlField('Blob endpoint'),
    bucketName: reqStr('Target Container Name'),
    auth: azureAuth(isEdit).required(),
  }).unknown(true);

const azureArchiveQueue = Joi.alternatives().conditional('.type', {
  switch: [
    {
      is: 'location-azure-servicebus-topic-v1',
      then: Joi.object({
        type: Joi.valid('location-azure-servicebus-topic-v1').required(),
        topicName: reqStr('Topic Name'),
        topicSubscriptionId: reqStr('Topic Subscription Name'),
        namespace: reqStr('Service Bus Endpoint'),
      }).unknown(true),
    },
    {
      is: 'location-azure-servicebus-queue-v1',
      then: Joi.object({
        type: Joi.valid('location-azure-servicebus-queue-v1').required(),
        queueName: reqStr('Queue Name'),
        namespace: reqStr('Service Bus Endpoint'),
      }).unknown(true),
    },
    {
      is: 'location-azure-storage-queue-v1',
      then: Joi.object({
        type: Joi.valid('location-azure-storage-queue-v1').required(),
        queueName: reqStr('Queue Name'),
        endpoint: urlField('Queue Endpoint'),
      }).unknown(true),
    },
  ],
  otherwise: Joi.any(),
});

const azureArchiveDetails = (isEdit: boolean) =>
  Joi.object({
    endpoint: urlField('Blob Endpoint'),
    bucketName: reqStr('Target Azure Container Name'),
    queue: azureArchiveQueue.required(),
    auth: azureAuth(isEdit).required(),
  }).unknown(true);

const coldLocationQueue = Joi.alternatives().conditional('.type', {
  switch: [
    {
      is: 'location-polling-v1',
      then: Joi.object({
        type: Joi.valid('location-polling-v1').required(),
        interval: Joi.string().allow('', null).optional(),
      }).unknown(true),
    },
    {
      is: 'location-aws-sqs-v1',
      then: Joi.object({
        type: Joi.valid('location-aws-sqs-v1').required(),
        queueUrl: urlField('SQS Queue URL'),
      }).unknown(true),
    },
  ],
  otherwise: Joi.any(),
});

const coldLocationDetails = (isEdit: boolean) =>
  Joi.object({
    endpoint: Joi.string().allow('').optional(),
    accessKey: reqStr('Access Key'),
    secretKey: editableSecret('Secret Key', isEdit),
    bucketName: reqStr('Target Bucket Name'),
    queue: coldLocationQueue.required(),
  }).unknown(true);

const hyperdriveDetails = Joi.object({
  bootstrapList: nonEmptyListField('Bootstrap List'),
}).unknown(true);

const sproxydDetails = Joi.object({
  bootstrapList: nonEmptyListField('Bootstrap List'),
  proxyPath: reqStr('Proxy Path'),
  chordCos: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string().pattern(/^\d+$/)).required().messages({
    'alternatives.match': 'Replication Factor must be a number',
    'any.required': 'Replication Factor for Small Objects is required',
  }),
}).unknown(true);

const tapeDmfDetails = (isEdit: boolean) =>
  Joi.object({
    endpoint: urlField('Endpoint'),
    repoId: nonEmptyListField('RepoId'),
    nsId: reqStr('Namespace Id'),
    username: reqStr('Username'),
    password: editableSecret('Password', isEdit),
  }).unknown(true);

const tapeMiriaDetails = (isEdit: boolean) =>
  Joi.object({
    endpoint: urlField('Endpoint'),
    repoId: nonEmptyListField('Atempo Miria Repository'),
    username: reqStr('Username'),
    password: editableSecret('Password', isEdit),
  }).unknown(true);

const crrDetails = (isEdit: boolean) =>
  Joi.object({
    endpoint: httpUrlField('S3 Endpoint'),
    stsEndpoint: httpUrlField('STS Endpoint'),
    accessKey: Joi.string().required().min(16).max(128).messages({
      'string.empty': 'Access key is required',
      'string.min': 'Access key must be between 16 and 128 characters',
      'string.max': 'Access key must be between 16 and 128 characters',
    }),
    secretKey: isEdit
      ? Joi.string().allow('').optional()
      : Joi.string().required().min(20).messages({
          'string.empty': 'Secret key is required',
          'string.min': 'Secret key must be at least 20 characters long',
        }),
  }).unknown(true);

const nfsDetails = Joi.object({
  endpoint: Joi.string()
    .required()
    .custom((value: string, helpers) => {
      if (!value) return helpers.error('any.required');
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        return helpers.error('nfs.invalidUrl');
      }
      const [protocol, version] = url.protocol.slice(0, -1).split('+');
      if (protocol !== 'tcp' && protocol !== 'udp') return helpers.error('nfs.invalidProtocol', { protocol });
      if (version !== 'v3' && version !== 'v4') return helpers.error('nfs.invalidVersion', { version });
      if (!url.host) return helpers.error('any.required');
      if (!url.pathname) return helpers.error('nfs.invalidPath');
      return value;
    })
    .messages({
      'string.empty': 'Server is required',
      'any.required': 'Server is required',
      'nfs.invalidUrl': 'Invalid NFS URL',
      'nfs.invalidProtocol': 'Invalid NFS protocol "{{#protocol}}"',
      'nfs.invalidVersion': 'Invalid NFS version "{{#version}}"',
      'nfs.invalidPath': 'Invalid path',
    }),
}).unknown(true);

const detailsByType = (locationType: string, isEdit: boolean): Joi.Schema => {
  switch (locationType as LocationTypeKey) {
    case 'location-aws-s3-v1':
      return awsS3Details(isEdit);
    case 'location-scality-artesca-s3-v1':
    case 'location-scality-ring-s3-v1':
    case 'location-ceph-radosgw-s3-v1':
      return awsCustomDetails(isEdit, true);
    case 'location-jaguar-ring-s3-v1':
    case 'location-orange-ring-s3-v1':
    case 'location-3ds-outscale-oos-public':
    case 'location-3ds-outscale-oos-snc':
      return awsCustomDetails(isEdit, false);
    case 'location-gcp-v1':
      return gcpDetails(isEdit);
    case 'location-wasabi-v1':
      return wasabiDetails(isEdit);
    case 'location-do-spaces-v1':
      return doSpacesDetails(isEdit);
    case 'location-oracle-ring-s3-v1':
      return oracleDetails(isEdit);
    case 'location-azure-v1':
      return azureDetails(isEdit);
    case 'location-azure-archive-v1':
      return azureArchiveDetails(isEdit);
    case 'location-aws-glacier-v1':
    case 'location-scaleway-glacier-v1':
    case 'location-ovh-cold-archive-v1':
    case 'location-versity-tape-archive-v1':
      return coldLocationDetails(isEdit);
    case 'location-scality-hdclient-v2':
      return hyperdriveDetails;
    case 'location-scality-sproxyd-v1':
      return sproxydDetails;
    case 'location-dmf-v1':
      return tapeDmfDetails(isEdit);
    case 'location-miria-v1':
      return tapeMiriaDetails(isEdit);
    case 'location-scality-crr-v1':
      return crrDetails(isEdit);
    case 'location-nfs-mount-v1':
      return nfsDetails;
    case 'location-file-v1':
      return Joi.any();
    default:
      return Joi.any();
  }
};

export const buildLocationSchema = (isEdit: boolean) =>
  Joi.object({
    name: nameField,
    locationType: Joi.string().required().messages({
      'string.empty': 'Location Type is required',
      'any.required': 'Location Type is required',
    }),
    objectId: Joi.any().optional(),
    options: Joi.any().optional(),
    details: Joi.any().when('locationType', {
      switch: [
        ...[
          'location-aws-s3-v1',
          'location-scality-artesca-s3-v1',
          'location-scality-ring-s3-v1',
          'location-ceph-radosgw-s3-v1',
          'location-jaguar-ring-s3-v1',
          'location-orange-ring-s3-v1',
          'location-3ds-outscale-oos-public',
          'location-3ds-outscale-oos-snc',
          'location-gcp-v1',
          'location-wasabi-v1',
          'location-do-spaces-v1',
          'location-oracle-ring-s3-v1',
          'location-azure-v1',
          'location-azure-archive-v1',
          'location-aws-glacier-v1',
          'location-scaleway-glacier-v1',
          'location-ovh-cold-archive-v1',
          'location-versity-tape-archive-v1',
          'location-scality-hdclient-v2',
          'location-scality-sproxyd-v1',
          'location-dmf-v1',
          'location-miria-v1',
          'location-scality-crr-v1',
          'location-nfs-mount-v1',
        ].map((type) => ({ is: type, then: detailsByType(type, isEdit) })),
      ],
      otherwise: Joi.any(),
    }),
  }).unknown(true);
