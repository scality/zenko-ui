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

export type S3Object = {|
    +Key: string,
    +LastModified: string,
    +Size: number,
|};

export type CommonPrefix = {|
    +Prefix: string,
|};

export type Object = {|
    +name: string,
    +lastModified?: string,
    +isFolder: string,
    +size: number,
|};

export type File = {|
    +path: string,
    +size: number,
|};
