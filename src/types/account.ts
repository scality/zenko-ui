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
  readonly CreationDate: number;
  readonly Roles: Array<Role>;
  readonly id: string;
};
export type AccountKey = {
  readonly userName: string;
  readonly accessKey: AccessKey;
  readonly secretKey: SecretKey;
};
