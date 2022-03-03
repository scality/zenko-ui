import type {
  DispatchFunction,
  GetStateFunction,
  SetZenkoClientAction,
  ThunkNonStatePromisedAction,
  ThunkStatePromisedAction,
  ZenkoAppendSearchListAction,
  ZenkoClearAction,
  ZenkoErrorAction,
  ZenkoWriteSearchListAction,
} from '../../types/actions';
import type {
  Marker,
  SearchBucketResp,
  SearchResultList,
  Site,
  ZenkoClientError,
  ZenkoClient as ZenkoClientInterface,
} from '../../types/zenko';
import { handleAWSClientError, handleAWSError } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';
import { until } from 'async';
import { loadInstanceLatestStatus } from './stats';
export const NETWORK_START_ACTION_STARTING_SEARCH = 'Starting search';
export const NETWORK_START_ACTION_SEARCHING_OBJECTS = 'Searching objects';
export const NETWORK_START_ACTION_CONTINUE_SEARCH = 'Continue search';
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
export function writeSearchListing(
  nextMarker: Marker,
  list: SearchResultList,
): ZenkoWriteSearchListAction {
  return {
    type: 'ZENKO_CLIENT_WRITE_SEARCH_LIST',
    nextMarker,
    list,
  };
}
export function appendSearchListing(
  nextMarker: Marker,
  list: SearchResultList,
): ZenkoAppendSearchListAction {
  return {
    type: 'ZENKO_CLIENT_APPEND_SEARCH_LIST',
    nextMarker,
    list,
  };
}
export function setZenkoClient(
  zenkoClient: ZenkoClientInterface,
): SetZenkoClientAction {
  return {
    type: 'SET_ZENKO_CLIENT',
    zenkoClient,
  };
}

function _isFolder(key: string): boolean {
  return key.substr(key.length - 1) === '/';
}

function _getSearchObjects(
  bucketName: string,
  query: string,
  marker?: Marker,
): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { zenkoClient } = getClients(getState());
    const params = {
      Bucket: bucketName,
      Query: query,
      Marker: marker ? marker : void 0,
    };
    dispatch(zenkoClearError());
    dispatch(networkStart(NETWORK_START_ACTION_SEARCHING_OBJECTS));
    return zenkoClient
      .searchBucket(params)
      .then(async ({ IsTruncated, NextMarker, Contents }: SearchBucketResp) => {
        const nextMarker = (IsTruncated && NextMarker) || null;
        const list = await Promise.all(
          Contents.map(async (object) => {
            object.IsFolder = _isFolder(object.Key);

            if (!object.IsFolder) {
              object.SignedUrl = zenkoClient.getObjectSignedUrl(
                bucketName,
                object.Key,
              );
              object.ObjectRetention = await zenkoClient.getObjectRetention(
                bucketName,
                object.Key,
              );
              object.IsLegalHoldEnabled = await zenkoClient.getObjectLegalHold(
                bucketName,
                object.Key,
              );
            }

            return object;
          }),
        );

        if (marker) {
          dispatch(appendSearchListing(nextMarker, list));
        } else {
          dispatch(writeSearchListing(nextMarker, list));
        }
      })
      .catch((err) => dispatch(zenkoHandleError(err, null, null)))
      .finally(() => dispatch(networkEnd()));
  };
}

export function newSearchListing(
  bucketName: string,
  query: string,
): ThunkNonStatePromisedAction {
  return (dispatch: DispatchFunction) => {
    dispatch(networkStart(NETWORK_START_ACTION_STARTING_SEARCH));
    return dispatch(_getSearchObjects(bucketName, query)).then(() =>
      dispatch(networkEnd()),
    );
  };
}
export function continueSearchListing(
  bucketName: string,
  query: string,
): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { s3 } = getState();
    const marker = s3.listObjectsResults.nextMarker;

    if (!marker) {
      return Promise.resolve();
    }

    dispatch(networkStart(NETWORK_START_ACTION_CONTINUE_SEARCH));
    return dispatch(_getSearchObjects(bucketName, query, marker)).then(() =>
      dispatch(networkEnd()),
    );
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
          instanceStatus.latest.metrics?.['ingest-schedule']?.states[
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
    return zenkoClient
      .pauseIngestionSite(site)
      .then(() => dispatch(waitForIngestionUpdate(site, 'disabled')))
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function resumeIngestionSite(site: Site): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Resuming Async Metadata updates'));
    return zenkoClient
      .resumeIngestionSite(site)
      .then(() => dispatch(waitForIngestionUpdate(site, 'enabled')))
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}