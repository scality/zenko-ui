export type IamAccessKey = {
  readonly AccessKeyId: string;
  readonly Status: string;
  readonly CreateDate: string;
};
export type ListAccessKeysResponse = {
  readonly AccessKeyMetadata: Array<IamAccessKey>;
};
