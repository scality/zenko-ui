import AWS from 'aws-sdk';
const async = require('async');

export default class S3Client {
    constructor(params) {
        this.client = new AWS.S3({
            endpoint: params.endpoint,
            accessKeyId: params.accessKey,
            secretAccessKey: params.secretKey,
            sessionToken: params.sessionToken,
            region: 'us-east-1',
            s3ForcePathStyle: true,
        });
    }

    listBuckets() {
        return this.client.listBuckets().promise();
        // return new Promise(resolve => {
        //     return resolve({Buckets: [
        //         { Name: 'scalitybucketoregon'},
        //         { Name: 'scalitybucketireland6'},
        //     ]});
        // });
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

}
