// @flow

export type AssumeRoleWithWebIdentityReq = {|
  +idToken: string,
  +RoleSessionName: string,
  +roleArn: string,
|};

export type AssumeRoleWithWebIdentityResp = {|
  +Credentials: {|
    +AccessKeyId: string,
    +SecretAccessKey: string,
    +SessionToken: string,
  |},
|};

export interface STSClient {
  assumeRoleWithWebIdentity(
    AssumeRoleWithWebIdentityReq,
  ): Promise<AssumeRoleWithWebIdentityResp>;
}
