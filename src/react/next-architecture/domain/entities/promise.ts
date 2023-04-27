type Loading = 'loading';
type Success = 'success';
type Error = 'error';
type Unknown = 'unknown';

export type PromiseStatus = Loading | Success | Error | Unknown;

export interface PromiseSucceedResult<T> {
  status: Success;
  value: T;
}

export interface PromiseRejectedResult {
  status: Error;
  title: string;
  reason: string;
}

export interface PromiseLoadingResult {
  status: Loading;
}

export interface PromiseUnknownResult {
  status: Unknown;
}

export type PromiseResult<T> =
  | PromiseLoadingResult
  | PromiseSucceedResult<T>
  | PromiseRejectedResult
  | PromiseUnknownResult;
