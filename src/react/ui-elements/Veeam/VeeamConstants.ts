export const BUCKET_TAG_USECASE = 'X-Scality-Usecase';
export const VEEAMVERSION11 = 'Veeam 11';
export const VEEAMVERSION12 = 'Veeam 12';
export type VeeamVersion = 'Veeam 12' | 'Veeam 11';
export const VEEAM_IMMUTABLE_POLICY_NAME = 'Scality-Veeam-Immutable-Policy';
export const GET_VEEAM_IMMUTABLE_POLICY = (bucketName: string) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'VisualEditor0',
        Effect: 'Allow',
        Action: [
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
        ],
        Resource: [
          `arn:aws:s3:::${bucketName}/*`,
          `arn:aws:s3:::${bucketName}`,
        ],
      },
      {
        Sid: 'VisualEditor1',
        Effect: 'Allow',
        Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
        Resource: '*',
      },
    ],
  });
export const VEEAM_XML_PREFIX = '.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c';
export const SYSTEM_XML_CONTENT = `<?xml version="1.0" encoding="UTF-8"?><SystemInfo><ProtocolVersion>"1.0"</ProtocolVersion><ModelName>"ARTESCA v1.7"</ModelName><ProtocolCapabilities><CapacityInfo>true</CapacityInfo><UploadSessions>false</UploadSessions><IAMSTS>false</IAMSTS></ProtocolCapabilities></SystemInfo>`;
export const GET_CAPACITY_XML_CONTENT = (capacity: number) =>
  `<?xml version="1.0" encoding="utf-8" ?><CapacityInfo><Capacity>${capacity}</Capacity><Available>0</Available><Used>0</Used></CapacityInfo>`;
