type Loading = 'loading';
type Success = 'success';
type Error = 'error';

export type PromiseStatus = Loading | Success | Error;

export interface PromiseSucceedResult<T> {
  status: Success;
  value: T;
}

export interface PromiseRejectedResult {
  status: Error;
  title: string;
  reason: string;
}

export interface PromiseLoading {
  status: Loading;
}

export type PromiseResult<T> =
  | PromiseLoading
  | PromiseSucceedResult<T>
  | PromiseRejectedResult;
