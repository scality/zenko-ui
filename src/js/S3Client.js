import AWS from 'aws-sdk';

export default class S3Client {
    constructor(creds) {
        this.client = new AWS.S3({
            // endpoint: 'https://s3.amazonaws.com',
            endpoint: 'http://127.0.0.1:8383/s3',
            accessKeyId: creds.accessKey,
            secretAccessKey: creds.secretKey,
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

    getBucketLocation(bucketName) {
        return this.client.getBucketLocation({ Bucket: bucketName }).promise();
    }

}
