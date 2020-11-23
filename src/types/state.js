// @flow

import type { AuthUser, UserManager as UserManagerInterface } from './auth';
import type { BucketInfo, Object, ObjectMetadata, S3Bucket } from './s3';
import type { BucketList, InstanceStatus } from './stats';
import type { ConfigurationOverlay, LocationName } from './config';
import type { ErrorViewType, FailureType } from './ui';
import type { Account } from './account';
import type { InstanceId } from './entities';
import { List } from 'immutable';
import type { ManagementClient as ManagementClientInterface } from './managementClient';
import type { RouterState } from 'connected-react-router';
import type { STSClient } from './sts';
import type { User } from './user';
import type { ZenkoClient as ZenkoClientInterface } from './zenko';

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
    +stsClient: STSClient,
    +userManager: UserManagerInterface,
    +config: {|
        +managementEndpoint: string,
        +oidcAuthority: string,
        +oidcClientId: string,
        +stsEndpoint: string,
        +zenkoEndpoint: string,
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

export type InstancesState = {|
    +selectedId: InstanceId | null,
|};

export type InstanceStatusState = {|
    +latest: InstanceStatus,
|};

export type NetworkActivityState = {|
    +counter: number,
    +authFailure: boolean,
    +failureType?: FailureType,
    +messages: List<string>,
|};

export type AccountsUIState = {|
    +showDelete: boolean,
|};

export type BucketsUIState = {|
    +showDelete: string,
|};

export type ObjectsUIState = {|
    +showFolderCreate: boolean,
    +showObjectUpload: boolean,
    +showObjectDelete: boolean,
|};

export type LocationsUIState = {|
    +showDeleteLocation: LocationName,
|};

export type StatsState = {|
    +bucketList: BucketList,
|};

export type S3State = {|
    +listBucketsResults: {|
        +list: List<S3Bucket>,
        +ownerName: string,
    |},
    +bucketInfo: BucketInfo,
    +listObjectsResults: {|
        +list: List<Object>,
    |},
    +listObjectsType: 's3' | 'md' | 'version',
    +objectMetadata: ?ObjectMetadata,
|};

export type ZenkoState = {|
    +zenkoClient: ZenkoClientInterface,
    +error: {|
        +message: null | string,
        +code: null | string | number,
        +target: null | string,
        +type: string | null,
    |},
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
    +router: RouterState,
    +uiErrors: ErrorsUIState,
    +uiLocations: LocationsUIState,
    +uiAccounts: AccountsUIState,
    +uiBuckets: BucketsUIState,
    +uiObjects: ObjectsUIState,
    +stats: StatsState,
    +s3: S3State,
    +zenko: ZenkoState,
};
