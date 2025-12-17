export type IamAccessKey = {
  readonly AccessKeyId: string;
  readonly Status: string;
  readonly CreateDate: Date;
};
export type ListAccessKeysResponse = {
  readonly AccessKeyMetadata: Array<IamAccessKey>;
};
