import S3 from 'aws-sdk/clients/s3';
import { chunkArray } from './utils';
import { isVersioning } from '../react/utils';
const MULTIPART_UPLOAD = {
  partSize: 1024 * 1024 * 6,
  queueSize: 1,
};
const publicAclIndicator = 'http://acs.amazonaws.com/groups/global/AllUsers';
export default class S3Client {
  client: S3;

  constructor(endpoint) {
    this.auth(endpoint, {});
  }

  auth(endpoint, creds) {
    this.client = new S3({
      endpoint: endpoint,
      accessKeyId: creds.accessKey,
      secretAccessKey: creds.secretKey,
      sessionToken: creds.sessionToken,
      region: 'us-east-1',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  listBuckets() {
    return this.client.listBuckets().promise();
  }

  listBucketsWithLocation() {
    return this.client
      .listBuckets()
      .promise()
      .then((list) => {
        return Promise.all(
          list.Buckets.map((bucket, key) => {
            return Promise.all([
              this.client
                .getBucketLocation({
                  Bucket: bucket.Name,
                })
                .promise(),
              this.client
                .getBucketVersioning({
                  Bucket: bucket.Name,
                })
                .promise(),
            ]).then(([loc, ver]) => {
              list.Buckets[key].LocationConstraint = loc.LocationConstraint;
              list.Buckets[key].VersionStatus = ver.Status;
            });
          }),
        ).then(() => {
          return list;
        });
      });
  }

  createBucket(bucket) {
    const params = {
      Bucket: bucket.name,
      CreateBucketConfiguration: {
        LocationConstraint: bucket.locationConstraint,
      },
      ObjectLockEnabledForBucket: bucket.isObjectLockEnabled,
    };
    return this.client.createBucket(params).promise();
  }

  putObjectLockConfiguration(objectLockConfiguration) {
    const params: S3.PutObjectLockConfigurationRequest = {
      Bucket: objectLockConfiguration.bucketName,
      ObjectLockConfiguration: {
        ObjectLockEnabled: 'Enabled',
        Rule: objectLockConfiguration.isDefaultRetentionEnabled
          ? {
              DefaultRetention: {
                Mode: objectLockConfiguration?.retentionMode,
                Days: objectLockConfiguration?.retentionPeriod?.days,
                Years: objectLockConfiguration?.retentionPeriod?.years,
              },
            }
          : undefined,
      },
    };
    return this.client.putObjectLockConfiguration(params).promise();
  }

  deleteBucket(bucketName) {
    const params = {
      Bucket: bucketName,
    };
    return this.client.deleteBucket(params).promise();
  }

  // objects
  listObjects(params) {
    const { Bucket, Prefix, ContinuationToken } = params;
    return this.client
      .listObjectsV2({
        Bucket,
        Delimiter: '/',
        Prefix,
        MaxKeys: 100,
        ContinuationToken,
      })
      .promise();
  }

  listObjectVersions(params) {
    const { Bucket, Prefix, KeyMarker, VersionIdMarker } = params;
    return this.client
      .listObjectVersions({
        Bucket,
        Prefix,
        Delimiter: '/',
        MaxKeys: 100,
        KeyMarker,
        VersionIdMarker,
      })
      .promise();
  }

  createFolder(bucketName, prefixWithSlash, folderName) {
    const key = `${prefixWithSlash}${folderName}`;
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    return this.client.putObject(params).promise();
  }

  uploadObject(bucketName, prefixWithSlash, files) {
    return Promise.all(
      files.map((file) => {
        const key = `${prefixWithSlash}${file.name}`;
        const params = {
          Bucket: bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
        };
        const options = {
          partSize: MULTIPART_UPLOAD.partSize,
          queueSize: MULTIPART_UPLOAD.queueSize,
        };
        return this.client.upload(params, options).promise();
      }),
    );
  }

  _deleteFolders(bucketName, folders) {
    return new Promise((resolve, reject) => {
      if (folders.length < 1) {
        return resolve();
      }

      return Promise.all(
        folders.map((folder) => {
          return this.listObjectVersions({
            Bucket: bucketName,
            Prefix: folder.Key,
          }).then((res) => {
            const { Versions, DeleteMarkers, CommonPrefixes } = res;
            const filteredVersions = Versions.filter(
              (v) => v.Key === folder.Key,
            );
            const filteredDM = DeleteMarkers.filter(
              (v) => v.Key === folder.Key,
            );

            // only delete "empty folders"
            if (
              CommonPrefixes.length > 0 ||
              filteredVersions.length + filteredDM.length <
                Versions.length + DeleteMarkers.length
            ) {
              return {
                Errors: [
                  Error('Cannot delete folder: The folder is not empty'),
                ],
              };
            }

            const versions = filteredVersions.map((v) => {
              return {
                Key: v.Key,
                VersionId: v.VersionId,
              };
            });
            const deleteMarkers = filteredDM.map((v) => {
              return {
                Key: v.Key,
                VersionId: v.VersionId,
              };
            });
            const objects = versions.concat(deleteMarkers);
            return this.client
              .deleteObjects({
                Bucket: bucketName,
                Delete: {
                  Objects: objects,
                },
              })
              .promise();
          });
        }),
      )
        .then((results) => {
          const error = results.find((result) => result.Errors.length > 0);

          if (error) {
            return reject(error.Errors[0]);
          }

          return resolve();
        })
        .catch((error) => reject(error));
    });
  }

  deleteObjects(bucketName, objects, folders) {
    return new Promise((resolve, reject) => {
      if (objects.length < 1) {
        return resolve();
      }

      // NOTE: AWS S3 deleteObjects can not delete more than 1000 objects.
      if (objects.length > 1000) {
        const chunks = chunkArray(objects, 1000);
        return Promise.all(
          chunks.map((chunk) => {
            const params = {
              Bucket: bucketName,
              Delete: {
                Objects: chunk,
              },
            };
            return this.client.deleteObjects(params).promise();
          }),
        )
          .then(() => resolve())
          .catch((error) => reject(error));
      }

      const params = {
        Bucket: bucketName,
        Delete: {
          Objects: objects,
        },
        BypassGovernanceRetention: true,
      };
      return this.client.deleteObjects(params, (error, data) => {
        const hasAccessDeniedError =
          data &&
          data.Errors &&
          data.Errors.some((error) => error.Code === 'AccessDenied');

        if (error || hasAccessDeniedError) {
          reject(error || data);
        }

        resolve(data);
      });
    }).then(() => this._deleteFolders(bucketName, folders));
  }

  getObjectSignedUrl(bucketName, objectName, versionId) {
    const params = {
      Bucket: bucketName,
      Key: objectName,
      VersionId: versionId,
    };
    return this.client.getSignedUrl('getObject', params);
  }

  getObjectRetention(bucketName, objectName, versionId) {
    const params = {
      Bucket: bucketName,
      Key: objectName,
      VersionId: versionId,
    };
    return new Promise((resolve, reject) => {
      this.client.getObjectRetention(params, (error, data) => {
        if (error) {
          if (
            error.code === 'NoSuchObjectLockConfiguration' ||
            error.code === 'InvalidRequest'
          ) {
            return resolve(undefined);
          }

          return reject(error);
        }

        return resolve(data);
      });
    });
  }

  getObjectLegalHold(bucketName, objectKey, versionId) {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      VersionId: versionId,
    };
    return new Promise((resolve, reject) => {
      this.client.getObjectLegalHold(params, (error, data) => {
        if (error) {
          if (
            error.code === 'NoSuchObjectLockConfiguration' ||
            error.code === 'InvalidRequest'
          ) {
            return resolve(false);
          }

          return reject(error);
        }

        if (data.Status) {
          return resolve(data.Status === 'ON');
        }

        return resolve(false);
      });
    });
  }

  putObjectRetention(
    bucketName,
    objectName,
    versionId,
    retentionMode,
    retentionUntilDate,
  ) {
    const params = {
      Bucket: bucketName,
      Key: objectName,
      Retention: {
        Mode: retentionMode,
        RetainUntilDate: retentionUntilDate,
      },
      VersionId: versionId,
      // TODO: Once DATA CONSUMER ROLE is implemented, checking `s3:BypassGovernanceRetention` permission will be needed
      BypassGovernanceRetention: true,
    };
    return this.client.putObjectRetention(params).promise();
  }

  // TODO: add VersionId
  headObject(bucketName, objectName, versionId) {
    const params = {
      Bucket: bucketName,
      Key: objectName,
      VersionId: versionId,
      // To avoid cached/outdated metadata.
      IfNoneMatch: '',
    };
    return this.client.headObject(params).promise();
  }

  putObjectMetadata(bucketName, objectKey, systemMetadata, userMetadata) {
    const {
      CacheControl,
      ContentDisposition,
      ContentEncoding,
      ContentType,
      WebsiteRedirectLocation,
    } = systemMetadata;
    const sourceName = `/${bucketName}/${objectKey}`;
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      CopySource: sourceName,
      CacheControl,
      ContentDisposition,
      ContentEncoding,
      ContentType,
      WebsiteRedirectLocation,
      Metadata: userMetadata,
      MetadataDirective: 'REPLACE',
    };
    return this.client.copyObject(params).promise();
  }

  getObjectTagging(bucketName, objectKey, versionId) {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      VersionId: versionId,
    };
    return this.client.getObjectTagging(params).promise();
  }

  putObjectTagging(bucketName, objectKey, tags, versionId) {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Tagging: {
        TagSet: tags,
      },
      VersionId: versionId,
    };
    return this.client.putObjectTagging(params).promise();
  }

  toggleVersioning(bucketName, isVersioning) {
    const params = {
      Bucket: bucketName,
      VersioningConfiguration: {
        Status: isVersioning ? 'Enabled' : 'Suspended',
      },
    };
    return this.client.putBucketVersioning(params).promise();
  }

  _getBucketCors(params) {
    return new Promise((resolve, reject) => {
      this.client.getBucketCors(params, (error) => {
        if (error) {
          if (error.code === 'NoSuchCORSConfiguration') {
            return resolve(false);
          }

          return reject(error);
        }

        return resolve(true);
      });
    });
  }

  _getBucketLocation(params) {
    return new Promise((resolve, reject) => {
      this.client.getBucketLocation(params, (error, data) => {
        error ? reject(error) : resolve(data.LocationConstraint);
      });
    });
  }

  _getBucketAcl(params) {
    return new Promise((resolve, reject) => {
      this.client.getBucketAcl(params, (error, data) => {
        if (error) {
          return reject(error);
        }

        return resolve(data);
      });
    });
  }

  _getBucketVersioning(params) {
    return new Promise((resolve, reject) => {
      this.client.getBucketVersioning(params, (error, data) => {
        if (error) {
          return reject(error);
        }

        if (data.Status) {
          return resolve(data.Status);
        }

        return resolve('Disabled');
      });
    });
  }

  _getBucketReplication(params) {
    return new Promise((resolve, reject) => {
      this.client.getBucketReplication(params, (error) => {
        if (error) {
          if (error.code === 'ReplicationConfigurationNotFoundError') {
            return resolve(false);
          }

          return reject(error);
        }

        return resolve(true);
      });
    });
  }

  _getBucketObjectLockConfiguration(params) {
    return new Promise((resolve, reject) => {
      this.client.getObjectLockConfiguration(params, (error, data) => {
        if (error) {
          if (error.code === 'ObjectLockConfigurationNotFoundError') {
            return resolve({
              ObjectLockEnabled: 'Disabled',
            });
          }

          return reject(error);
        }

        if (data) {
          return resolve(data);
        }

        return resolve({
          ObjectLockEnabled: 'Disabled',
        });
      });
    });
  }

  getBucketInfo(bucketName) {
    const params = {
      Bucket: bucketName,
    };
    const bucketInfo = {
      name: bucketName,
      policy: false,
      owner: '',
      aclGrantees: 0,
      cors: false,
      isVersioning: false,
      versioning: 'Disabled',
      public: false,
      locationConstraint: '',
    };
    return new Promise((resolve, reject) => {
      return Promise.all([
        this._getBucketCors(params),
        this._getBucketLocation(params),
        this._getBucketAcl(params),
        this._getBucketVersioning(params),
        this._getBucketObjectLockConfiguration(params),
      ])
        .then((values) => {
          const [cors, location, acl, versioning, objectLockConfiguration] =
            values;
          bucketInfo.cors = cors;
          bucketInfo.locationConstraint = location;
          bucketInfo.owner = acl.Owner.DisplayName;
          bucketInfo.aclGrantees = acl.Grants.length;
          bucketInfo.public = acl.Grants.find(
            (grant) => grant.Grantee.URI === publicAclIndicator,
          );
          bucketInfo.versioning = versioning;
          bucketInfo.isVersioning = isVersioning(versioning);
          bucketInfo.objectLockConfiguration = objectLockConfiguration;
          return resolve(bucketInfo);
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }

  putObjectLegalHold(bucketName, objectKey, versionId, isLegalHold) {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      VersionId: versionId,
      LegalHold: {
        Status: isLegalHold ? 'ON' : 'OFF',
      },
    };
    return this.client.putObjectLegalHold(params).promise();
  }
}
