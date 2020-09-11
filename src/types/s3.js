// @flow

export interface S3Client {

}

export type CreateBucketRequest = {|
    +name: string,
    +locationContraint: string,
|};

export type S3Bucket = {|
    +CreationDate: string,
    +Name: string,
|};
