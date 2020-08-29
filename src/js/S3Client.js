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
                return resolve({
                    Owner: { DisplayName: 'bart' },
                    Buckets: [
                        { Name: 'bucket1' },
                        { Name: 'bucket2' },
                        { Name: 'bucket3' },
                        { Name: 'bucket4' },
                        { Name: 'bucket5' },
                        { Name: 'bucket6' },
                        { Name: 'bucket7' },
                        { Name: 'bucket8' },
                        { Name: 'bucket9' },
                        { Name: 'bucket10' },
                        { Name: 'bucket11' },
                        { Name: 'bucket12' },
                        { Name: 'bucket13' },
                        { Name: 'bucket14' },
                        { Name: 'bucket15' },
                    ]
                });
                // return async.eachOf(list.Buckets, (bucket, key, cb) => {
                //     return this.client.getBucketLocation({ Bucket: bucket.Name },
                //         (error, data) => {
                //             if (error) {
                //                 return cb(error);
                //             }
                //             list.Buckets[key].LocationConstraint =
                //             data.LocationConstraint;
                //             return cb(null);
                //         });
                // }, err => err ? reject(error) : resolve(list));
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

}
