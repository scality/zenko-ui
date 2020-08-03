// @flow
import type { AuthUser, UserManager as UserManagerInterface } from '../../types/auth';
import { ApiErrorObject } from './error';

const authUser: AuthUser = {
    id_token: 'id_token',
    access_token: 'access_token',
    token_type: 'bearer',
    scope: 'openid profile email',
    profile: { sub: 'uuid' },
    expires_at: 1596428238,
    state: {},
};

export class MockUserManager {
    signinRedirect() {
        return Promise.resolve();
    }

    signinRedirectCallback() {
        return Promise.resolve(authUser);
    }

    removeUser() {
        return Promise.resolve();
    }

    signoutPopup() {
        return Promise.resolve();
    }

    signoutPopupCallback() {
        return Promise.resolve();
    }
}

export class ErrorUserManager implements UserManagerInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
        this._error = error;
    }

    signinRedirect() {
        return Promise.reject(this._error);
    }

    signinRedirectCallback() {
        return Promise.reject(this._error);
    }

    removeUser() {
        return Promise.reject(this._error);
    }

    signoutPopup() {
        return Promise.reject(this._error);
    }

    signoutPopupCallback() {
        return Promise.reject(this._error);
    }
}
