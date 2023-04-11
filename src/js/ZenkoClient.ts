import type {
  Credentials,
  SearchBucketResp,
  SearchBucketVersionsResp,
  SearchParams,
  SearchVersionParams,
  Site,
  ZenkoClient as ZenkoClientInterface,
  ZenkoMapResp,
} from '../types/zenko';
import S3Client from './S3Client';
// TODO: prevent zenkoclient from including in the bundle the full AWS SDK.
import ZenkoClientBase from 'zenkoclient';

class ZenkoClient extends S3Client implements ZenkoClientInterface {
  endpoint: string;
  _xmlClient: ZenkoClientBase;
  _isLogin: boolean;
  _jsonClient: ZenkoClientBase;

  constructor(
    endpoint: string,
    iamInternalFQDN: string,
    s3InternalFQDN: string,
  ) {
    super(endpoint, iamInternalFQDN, s3InternalFQDN);
    this.endpoint = endpoint;

    this._init();
    this._isLogin = false;
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
    this._jsonClient = new ZenkoClientBase({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      sessionToken,
      apiVersion: '2018-07-08-json',
      endpoint: this.endpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      maxRetries: 0,
    });
  }

  logout() {
    this._xmlClient.config.update({
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    });

    this.client.config.update({
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    });

    this._jsonClient.config.update({
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    });
  }

  login(params: Credentials): void {
    const { accessKey, secretKey, sessionToken } = params;

    this._xmlClient.config.update({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      sessionToken,
    });

    this._jsonClient.config.update({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      sessionToken,
    });

    // TODO: use this.client.config.update instead of creating a new instance of S3.
    this.auth(this.endpoint, params); // updating credentials not working for AWS.S3.upload() call returning
    // "Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1"
    // but seems to work for all the other S3 calls.
    // this.client.config.update({
    //     accessKeyId: accessKey, secretAccessKey: secretKey, sessionToken });

    this._isLogin = true;
  }

  searchBucket(params: SearchParams): Promise<SearchBucketResp> {
    const { Bucket, Query, Marker } = params;
    return this._xmlClient
      .searchBucketV2({
        Bucket,
        Query,
        ContinuationToken: Marker,
        MaxKeys: 100,
      })
      .promise();
  }

  searchBucketVersions(
    params: SearchVersionParams,
  ): Promise<SearchBucketVersionsResp> {
    const { Bucket, Query, KeyMarker, VersionIdMarker } = params;

    return this._xmlClient
      .searchBucketVersions({
        Bucket,
        Query,
        KeyMarker,
        VersionIdMarker: parseInt(VersionIdMarker || '0', 10),
        MaxKeys: 100,
      })
      .promise();
  }

  pauseCrrSite(site: Site): Promise<ZenkoMapResp> {
    const params = {
      Site: site,
    };

    return this._jsonClient.pauseSite(params).promise();
  }

  pauseIngestionSite(site: Site): Promise<ZenkoMapResp> {
    const params = {
      Site: site,
    };
    return this._jsonClient.pauseIngestionSite(params).promise();
  }

  resumeCrrSite(site: Site): Promise<ZenkoMapResp> {
    const params = {
      Site: site,
    };
    return this._jsonClient.resumeSite(params).promise();
  }

  resumeIngestionSite(site: Site): Promise<ZenkoMapResp> {
    const params = {
      Site: site,
    };
    return this._jsonClient.resumeIngestionSite(params).promise();
  }

  getIsLogin() {
    return this._isLogin;
  }
}

export default ZenkoClient;
