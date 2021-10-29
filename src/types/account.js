// @flow

export type AccessKey = string;
export type SecretKey = string;

export type CreateAccountRequest = {|
  +userName: string,
  +email: string,
  +quotaMax: number,
|};

export type Account = {|
  +userName: string,
  +email: string,
  +quotaMax?: number,
  +canonicalId: string,
  +arn: string,
  +createDate: number,
  +id: string,
|};

export type AccountKey = {|
  +accountName: string,
  +accessKey: AccessKey,
  +secretKey: SecretKey,
|};
