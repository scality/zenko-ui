export type AccessKey = string;
export type SecretKey = string;
export type CreateAccountRequest = {
  readonly Name: string;
  readonly email: string;
  readonly quotaMax: number;
};
export type Role = {
  readonly Arn: string;
  readonly Name: string;
};
export type Account = {
  readonly Name: string;
  readonly creationDate: number;
  readonly Roles: Array<Role>;
  readonly id: string;
};
export type AccountKey = {
  readonly accountName: string;
  readonly accessKey: AccessKey;
  readonly secretKey: SecretKey;
};
