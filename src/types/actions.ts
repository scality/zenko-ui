// Redux action types - being removed progressively
// Kept for backwards compatibility

import { AppState } from './state';

export type DispatchFunction = (arg0: Action) => unknown;
export type GetStateFunction = () => AppState;

export interface ApiError extends Error {
  status: 200 | 400 | 401 | 403 | 422 | 500 | 503;
}

export type ThunkStatePromisedAction = (
  arg0: DispatchFunction,
  arg1: GetStateFunction,
) => Promise<unknown>;

export type ThunkNonStateAction = (arg0: DispatchFunction) => void;

export type Action = ThunkNonStateAction | ThunkStatePromisedAction;
