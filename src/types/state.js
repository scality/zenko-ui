// @flow
import type { AuthUser } from './auth';
import type { ManagementClient as ManagementClientInterface } from './managementClient';
import type { S3Client as S3ClientInterface } from './s3Client';
import type { User } from './user';
import type { UserManager as UserManagerInterface } from './auth';

export type IAMResp = {};

export interface IAMClientType {
    createUser(userName: string): Promise<IAMResp>;
}

export type IAMClientState = null | {|
    +client: IAMClientType,
|};

export type UserState = {
    list: Array<User>,
};

export type AuthState = {|
    +isUserLoaded: string,
    +configFailure: boolean,
    +isSigningOut: boolean,
    +managementClient: ManagementClientInterface,
    +s3Client: S3ClientInterface,
    +userManager: UserManagerInterface,
    +config: {|
        +managementEndpoint: string,
        +oidcAuthority: string,
        +oidcClientId: string,
        +stsEndpoint: string,
        +s3Endpoint: string,
    |},
|};

export type OIDCState = {|
    +user: AuthUser,
    +isLoadingUser: boolean,
|};

export type UIErrorState = {|
    +errorMsg: string,
    +errorType: string,
|};

export type AppState = {
    +auth: AuthState,
    +oidc: OIDCState,
    +user: UserState,
    +uiErrors: UIErrorState,
};
