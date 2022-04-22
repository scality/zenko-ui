export type AccessKey = string;
export type SecretKey = string;
export type CreateAccountRequest = {
  readonly Name: string;
  readonly email: string;
  readonly quotaMax: number;
};
export type Account = {
  readonly Name: string;
  readonly email: string;
  readonly quotaMax?: number;
  readonly canonicalId: string;
  readonly arn: string;
  readonly createDate: number;
  readonly id: string;
};
export type AccountKey = {
  readonly accountName: string;
  readonly accessKey: AccessKey;
  readonly secretKey: SecretKey;
};
