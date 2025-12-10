import {
  DispatchFunction,
  GetStateFunction,
  ThunkStatePromisedAction,
  ZenkoClearAction,
  ZenkoErrorAction,
} from '../../types/actions';
import {
  Site,
  ZenkoClientError,
} from '../../types/zenko';
import { handleAWSClientError, handleAWSError } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';
import { until } from 'async';
import { loadInstanceLatestStatus } from './stats';

export function zenkoClearError(): ZenkoClearAction {
  return {
    type: 'ZENKO_CLEAR_ERROR',
  };
}
export function zenkoHandleError(
  error: ZenkoClientError,
  target: string | null,
  type: string | null,
): ZenkoErrorAction {
  return {
    type: 'ZENKO_HANDLE_ERROR',
    errorMsg: error.message || null,
    errorCode: error.code || null,
    errorType: type,
    errorTarget: target,
  };
}

export function waitForIngestionUpdate(
  locationName: string,
  expectedState: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) =>
    until(
      (cb) => {
        const { instanceStatus } = getState();
        const actualState =
          instanceStatus.latest.metrics?.['ingest-schedule']?.states?.[
            locationName
          ];
        setTimeout(cb, 500, null, actualState === expectedState);
      },
      (next) => dispatch(loadInstanceLatestStatus()).then(next),
    );
}

export function pauseIngestionSite(site: Site): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Pausing Async Metadata updates'));
    return (
      zenkoClient
        //@ts-expect-error fix this when you are working on it
        .pauseIngestionSite(site)
        .then(() => dispatch(waitForIngestionUpdate(site, 'disabled')))
        .catch((error) => dispatch(handleAWSClientError(error)))
        .catch((error) => dispatch(handleAWSError(error, 'byModal')))
        .finally(() => dispatch(networkEnd()))
    );
  };
}
export function resumeIngestionSite(site: Site): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Resuming Async Metadata updates'));
    return (
      zenkoClient
        //@ts-expect-error fix this when you are working on it
        .resumeIngestionSite(site)
        .then(() => dispatch(waitForIngestionUpdate(site, 'enabled')))
        .catch((error) => dispatch(handleAWSClientError(error)))
        .catch((error) => dispatch(handleAWSError(error, 'byModal')))
        .finally(() => dispatch(networkEnd()))
    );
  };
}
