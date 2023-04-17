type Idle = 'idle';
type Loading = 'loading';
type NotResolved = Idle | Loading;
type Success = 'success';
type Error = 'error';

export type PromiseStatus = NotResolved | Success | Error;

export interface PromiseSucceedResult<T> {
  status: Success;
  value: T;
}

export interface PromiseRejectedResult {
  status: Error;
  title: string;
  reason: string;
}

export interface PromiseNotResolved {
  status: NotResolved;
}

export type PromiseResult<T> =
  | PromiseNotResolved
  | PromiseSucceedResult<T>
  | PromiseRejectedResult;
