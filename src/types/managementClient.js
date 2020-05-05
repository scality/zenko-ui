// @flow

export type ApiAccountResponse = {
    body: {
      +arn: string,
      +canonicalId: string,
      +createDate: string,
      +email: string,
      +id: string,
      +quotaMax?: number,
      +userName: string,
    },
};

export interface ManagementClient {

}
