// @noflow

import S3 from 'aws-sdk/clients/s3';
const async = require('async');

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
        return new Promise((resolve, reject) => {
            this.client.listBuckets((error, list) => {
                if (error) {
                    return reject(error);
                }
                return async.eachOf(list.Buckets, (bucket, key, cb) => {
                    return this.client.getBucketLocation({ Bucket: bucket.Name },
                        (error, data) => {
                            if (error) {
                                return cb(error);
                            }
                            list.Buckets[key].LocationConstraint =
                            data.LocationConstraint;
                            return cb(null);
                        });
                }, err => err ? reject(error) : resolve(list));
            });
        });
    }

    createBucket(bucket) {
        const params = {
            Bucket: bucket.name,
            CreateBucketConfiguration: {
                LocationConstraint: bucket.locationConstraint,
            },
        };
        return this.client.createBucket(params).promise();
    }

    deleteBucket(bucketName) {
        const params = {
            Bucket: bucketName,
        };
        return this.client.deleteBucket(params).promise();
    }

    // objects
    listObjects(bucketName, prefix) {
        const params = {
            Bucket: bucketName,
            Delimiter: '/',
            Prefix: prefix,
        };
        return this.client.listObjectsV2(params).promise();
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
        return Promise.all(files.map(file => {
            const key = `${prefixWithSlash}${file.name}`;
            const params = {
                Bucket: bucketName,
                Key: key,
                Body: file,
                ContentType: file.type,
            };
            const options = { partSize: MULTIPART_UPLOAD.partSize,
                queueSize: MULTIPART_UPLOAD.queueSize };
            return this.client.upload(params, options).promise();
        }));
    }

    deleteObjects(bucketName, objects) {
        const params = {
            Bucket: bucketName,
            Delete: {
                Objects: objects,
            },
        };
        return this.client.deleteObjects(params).promise();
    }

    getObjectSignedUrl(bucketName, objectName){
        const params = {
            Bucket: bucketName,
            Key: objectName,
        };
        return this.client.getSignedUrl('getObject', params);
    }

    // TODO: add VersionId
    headObject(bucketName, objectName) {
        const params = {
            Bucket: bucketName,
            Key: objectName,
        };
        return this.client.headObject(params).promise();
    }

    putObjectMetadata(bucketName, objectKey, systemMetadata, userMetadata) {
        const { CacheControl, ContentDisposition, ContentEncoding,
            ContentType, WebsiteRedirectLocation } = systemMetadata;
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

    getObjectTagging(bucketName, objectKey) {
        const params = {
            Bucket: bucketName,
            Key: objectKey,
        };
        return this.client.getObjectTagging(params).promise();
    }

    putObjectTagging(bucketName, objectKey, tags) {
        const params = {
            Bucket: bucketName,
            Key: objectKey,
            Tagging: {
                TagSet: tags,
            },
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
        console.log('params!!!', params);
        return this.client.putBucketVersioning(params).promise();
    }

    getBucketCors(params) {
        return new Promise((resolve, reject) => {
            this.client.getBucketCors(params, error => {
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

    getBucketLocation(params) {
        return new Promise((resolve, reject) => {
            this.client.getBucketLocation(params, (error, data) => {
                (error) ? reject(error) : resolve(data.LocationConstraint);
            });
        });
    }

    getBucketAcl(params) {
        return new Promise((resolve, reject) => {
            this.client.getBucketAcl(params, (error, data) => {
                if (error) {
                    return reject(error);
                }
                return resolve(data);
            });
        });
    }

    getBucketVersioning(params) {
        return new Promise((resolve, reject) => {
            this.client.getBucketVersioning(params, (error, data) => {
                if (error) {
                    return reject(error);
                }
                if (data.Status && data.Status === 'Enabled') {
                    return resolve(true);
                }
                return resolve(false);
            });
        });
    }

    getBucketReplication(params) {
        return new Promise((resolve, reject) => {
            this.client.getBucketReplication(params, error => {
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
            corsRules: [],
            versioning: false,
            crossRegionReplication: false,
            public: false,
            locationConstraint: '',
        };

        return new Promise((resolve, reject) => {
            return Promise.all([this.getBucketCors(params), this.getBucketLocation(params),
                this.getBucketAcl(params), this.getBucketVersioning(params),
                this.getBucketReplication(params)])
                .then((values) => {
                    bucketInfo.cors = values[0];
                    bucketInfo.locationConstraint = values[1];
                    const dataACL = values[2];
                    bucketInfo.owner = dataACL.Owner.DisplayName;
                    bucketInfo.aclGrantees = dataACL.Grants.length;

                    if (dataACL.Grants.length > 0) {
                        bucketInfo.public = dataACL.Grants.find(grant => grant.Grantee.URI ===
                            publicAclIndicator);
                    }
                    bucketInfo.versioning = values[3];
                    bucketInfo.crossRegionReplication = values[4];
                    return resolve(bucketInfo);
                })
                .catch(error => {
                    return reject(error);
                });
        });
    }
}
