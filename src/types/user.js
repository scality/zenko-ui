// @flow

export type User = {|
    +userName: string,
|};

export type IamAccessKey = {|
    +AccessKeyId: string,
    +Status: string,
    +CreateDate: string,
|};

export type ListAccessKeysResponse = {|
    +AccessKeyMetadata: Array<IamAccessKey>,
|};
