export type AssumeRoleWithWebIdentityReq = {
  readonly idToken: string;
  readonly RoleSessionName: string;
  readonly roleArn: string;
};
export type AssumeRoleWithWebIdentityResp = {
  readonly Credentials: {
    readonly AccessKeyId: string;
    readonly SecretAccessKey: string;
    readonly SessionToken: string;
  };
};
export interface STSClient {
  assumeRoleWithWebIdentity(
    arg0: AssumeRoleWithWebIdentityReq,
  ): Promise<AssumeRoleWithWebIdentityResp>;
}