// @flow

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

export type AppState = {
    user: UserState,
    +iamClient: IAMClientState,
};
