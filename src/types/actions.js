// @flow

import type { AppState } from './state';

export type ErrorViewType = 'byModal' | 'byComponent' | 'byAuth';

export type DispatchFunction = (Action) => any;

export type GetStateFunction = () => AppState;


export interface ApiError extends Error {
    status: 200 | 401 | 403 | 422 | 500 | 503;
}

export type ThunkNonStateAction = (DispatchFunction) => void;

export type ClearErrorAction = {|
    +type: 'CLEAR_ERROR',
|};

export type HandleErrorAction = {|
    +type: 'HANDLE_ERROR',
    +errorMsg: string | void,
    +errorType: ErrorViewType,
|};
