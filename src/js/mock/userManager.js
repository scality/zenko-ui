// @flow

import { ApiErrorObject } from './error';
import type { UserManager as UserManagerInterface } from '../../types/auth';

export class MockUserManager implements UserManagerInterface {
    signinRedirect() {
        return Promise.resolve({});
    }

    signinRedirectCallback() {
        return Promise.resolve({});
    }

    removeUser() {
        return Promise.resolve({});
    }

    signoutPopup() {
        return Promise.resolve({});
    }

    signoutPopupCallback() {
        return Promise.resolve({});
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
