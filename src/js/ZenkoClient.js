// @noflow

import type {
    Credentials,
    SearchBucketResp,
    SearchParams,
    ZenkoClient as ZenkoClientInterface,
} from '../types/zenko';
import S3Client from './S3Client';
// TODO: prevent zenkoclient from including in the bundle the full AWS SDK.
import ZenkoClientBase from 'zenkoclient';

export const zenkoError = {
    message: 'S3 Client Api Error Response',
    code: 500,
};


class ZenkoClient extends S3Client implements ZenkoClientInterface {
    endpoint: string;
    _xmlClient: ZenkoClientBase;

    constructor(endpoint) {
        super(endpoint);
        this.endpoint = endpoint;
        this._init();
    }

    _init() {
        const accessKey = '';
        const secretKey = '';
        const sessionToken = '';
        this._xmlClient = new ZenkoClientBase({
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
            sessionToken,
            apiVersion: '2018-07-11-xml',
            endpoint: this.endpoint,
            // sslEnabled: false,
            s3ForcePathStyle: true,
            signatureVersion: 'v4',
            maxRetries: 0,
        });
    }

    logout() {
        this._xmlClient.config.update({ accessKeyId: '', secretAccessKey: '', sessionToken: '' });
        this.client.config.update({ accessKeyId: '', secretAccessKey: '', sessionToken: '' });
    }

    login(params: Credentials): void {
        const { accessKey, secretKey, sessionToken } = params;
        this._xmlClient.config.update({
            accessKeyId: accessKey, secretAccessKey: secretKey, sessionToken });

        // TODO: use this.client.config.update instead of creating a new instance of S3.
        this.auth(this.endpoint, params);
        // updating credentials not working for AWS.S3.upload() call returning
        // "Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1"
        // but seems to work for all the other S3 calls.
        // this.client.config.update({
        //     accessKeyId: accessKey, secretAccessKey: secretKey, sessionToken });
    }

    searchBucket(params: SearchParams): Promise<SearchBucketResp> {
        const { Bucket, Query, Marker } = params;
        return this._xmlClient.searchBucket({
            Bucket,
            Query,
            Marker,
        }).promise();
    }
}

export default ZenkoClient;
