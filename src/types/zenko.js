// @flow

export type Marker = null | string;

export type SearchParams = {|
    +Bucket: string,
    +Query: string,
    +Marker?: string,
 |};

export type SearchResult = {
    +Key: string,
    +LastModified: Date,
    +ETag: string,
    +Size: number,
    IsFolder: boolean,
    SignedUrl?: string,
};

export type SearchResultList = Array<SearchResult>;

export type SearchBucketResp = {
    IsTruncated?: boolean,
    NextMarker?: Marker,
    Contents: SearchResultList,
};

export type Credentials = {|
    +accessKey: string,
    +secretKey: string,
    +sessionToken?: string,
|};

export interface ZenkoClientError extends Error {
    code?: string | number;
}

export type ConnectionResp = void | ZenkoClientError;

export type ZenkoMapResp = {};

export type ZenkoErrorType = 'ingestion' | 'replication' | 'failed' | null;
export interface ZenkoClient {
    _init(): void;
    logout(): void;
    login(params: Credentials): void;

    searchBucket(params: SearchParams): Promise<SearchBucketResp>;
}
