// @flow

import type { AuthUser, UserManager as UserManagerInterface } from './auth';
import type { Account } from './account';
import type { ConfigurationOverlay } from './config';
import type { ErrorViewType } from './ui';
import type { InstanceId } from './entities';
import type { InstanceStatus } from './stats';
import { List } from 'immutable';
import type { ManagementClient as ManagementClientInterface } from './managementClient';
import type { RouterState } from 'connected-react-router';
import type { S3Client as S3ClientInterface } from './s3Client';
import type { User } from './user';

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

export type ErrorsUIState = {|
    +errorMsg: string | null,
    +errorType: ErrorViewType | null,
|};

export type ConfigurationState = {|
    +latest: ConfigurationOverlay,
|};

export type AccountState = {|
    +display: Account,
|};

export type InstancesState =  {|
    +selectedId: InstanceId | null,
|};

export type InstanceStatusState = {|
    +latest: InstanceStatus,
|};

export type NetworkActivityState = {|
    +counter: number,
    +authFailure: boolean,
    +messages: List<string>,
|};

export type AccountUIState = {|
    +showDelete: boolean,
|};

export type AppState = {
    +account: AccountState,
    +auth: AuthState,
    +configuration: ConfigurationState,
    +instances: InstancesState,
    +instanceStatus: InstanceStatusState,
    +networkActivity: NetworkActivityState,
    +oidc: OIDCState,
    +user: UserState,
    +uiErrors: ErrorsUIState,
    +router: RouterState,
    +uiAccount: AccountUIState,
};
