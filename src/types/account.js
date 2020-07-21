// @flow

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
