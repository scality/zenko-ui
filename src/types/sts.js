// @flow

export type AssumeRoleWithWebIdentityReq = {|
  +idToken: string,
  +RoleSessionName: string,
  +roleArn?: string,
|};

export type AssumeRoleWithWebIdentityResp = {|
  +Credentials: {|
    +AccessKeyId: string,
    +SecretAccessKey: string,
    // TODO after Vault.assumeRoleWithWebIdentity changes:
    // SessionToken should not be “optional” value.
    +SessionToken?: string,
  |},
|};

export interface STSClient {
  assumeRoleWithWebIdentity(
    AssumeRoleWithWebIdentityReq,
  ): Promise<AssumeRoleWithWebIdentityResp>;
}
