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
import { ListObjectVersionsOutput } from 'aws-sdk/clients/s3';
import { handleAWSClientError, handleAWSError } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';
import { until } from 'async';
import { loadInstanceLatestStatus } from './stats';
import {
  continueListObjectVersionsSuccess,
  listObjectVersionsSuccess,
} from './s3object';
import { LIST_OBJECT_VERSIONS_S3_TYPE } from '../utils/s3';
import { ListObjectsType } from '../../types/s3';
export const NETWORK_START_ACTION_STARTING_SEARCH = 'Starting search';
export const NETWORK_START_ACTION_SEARCHING_OBJECTS = 'Searching objects';
export const NETWORK_START_ACTION_SEARCHING_NEXT_OBJECTS =
  'Loading next page of objects matching your search';
export const NETWORK_START_ACTION_SEARCHING_VERSIONS = 'Searching versions';
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
    if (marker) {
      dispatch(networkStart(NETWORK_START_ACTION_SEARCHING_NEXT_OBJECTS));
    } else {
      dispatch(networkStart(NETWORK_START_ACTION_SEARCHING_OBJECTS));
    }
    return zenkoClient
      .searchBucket(params)
      .then(
        async ({
          IsTruncated,
          NextContinuationToken,
          Contents,
        }: SearchBucketResp) => {
          const nextMarker = (IsTruncated && NextContinuationToken) || null;

          const list = await Promise.all(
            (Contents || []).map(async (object) => {
              //@ts-expect-error fix this when you are working on it
              object.IsFolder = _isFolder(object.Key);

              //@ts-expect-error fix this when you are working on it
              if (!object.IsFolder) {
                //@ts-expect-error fix this when you are working on it
                object.SignedUrl = zenkoClient.getObjectSignedUrl(
                  bucketName,
                  object.Key,
                );
                //@ts-expect-error fix this when you are working on it
                object.ObjectRetention = await zenkoClient.getObjectRetention(
                  bucketName,
                  object.Key,
                );
                //@ts-expect-error fix this when you are working on it
                object.IsLegalHoldEnabled =
                  //@ts-expect-error fix this when you are working on it
                  await zenkoClient.getObjectLegalHold(bucketName, object.Key);
              }

              return object;
            }),
          );

          if (marker) {
            //@ts-expect-error fix this when you are working on it
            dispatch(appendSearchListing(nextMarker, list));
          } else {
            //@ts-expect-error fix this when you are working on it
            dispatch(writeSearchListing(nextMarker, list));
          }
        },
      )
      .catch((err) => dispatch(zenkoHandleError(err, null, null)))
      .finally(() => dispatch(networkEnd()));
  };
}

function _getSearchVersions(
  bucketName: string,
  query: string,
  keyMarker?: Marker,
  versionIdMarker?: Marker,
) {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { zenkoClient } = getClients(getState());
    const params = {
      Bucket: bucketName,
      Query: query,
      KeyMarker: keyMarker ? keyMarker : void 0,
      VersionIdMarker:
        versionIdMarker && versionIdMarker !== 'null'
          ? versionIdMarker
          : void 0,
    };
    dispatch(zenkoClearError());
    dispatch(networkStart(NETWORK_START_ACTION_SEARCHING_VERSIONS));
    return zenkoClient
      .searchBucketVersions(params)
      .then(
        async ({
          NextKeyMarker,
          NextVersionIdMarker,
          //@ts-expect-error fix this when you are working on it
          Version,
          //@ts-expect-error fix this when you are working on it
          DeleteMarker,
          CommonPrefixes,
          Prefix,
        }: ListObjectVersionsOutput) => {
          if (keyMarker) {
            return dispatch(
              continueListObjectVersionsSuccess(
                Version,
                DeleteMarker,
                //@ts-expect-error fix this when you are working on it
                CommonPrefixes,
                Prefix,
                NextKeyMarker,
                NextVersionIdMarker,
              ),
            );
          }
          return dispatch(
            listObjectVersionsSuccess(
              Version,
              DeleteMarker,
              //@ts-expect-error fix this when you are working on it
              CommonPrefixes,
              Prefix,
              NextKeyMarker,
              NextVersionIdMarker,
            ),
          );
        },
      )
      .catch((err) => {
        return dispatch(zenkoHandleError(err, null, null));
      })
      .finally(() => dispatch(networkEnd()));
  };
}

function _continueSearchVersions(bucketName: string, query: string) {
  return (dispatch, getState) => {
    const { s3 } = getState();
    const marker = s3.listObjectsResults.nextMarker;
    const versionIdMarker = s3.listObjectsResults.nextVersionIdMarker;

    if (!marker || !versionIdMarker) {
      return Promise.resolve();
    }

    return dispatch(
      _getSearchVersions(bucketName, query, marker, versionIdMarker),
    );
  };
}
function _continueSearchObjectsNoVersions(bucketName: string, query: string) {
  return (dispatch, getState) => {
    const { s3 } = getState();
    const marker = s3.listObjectsResults.nextMarker;

    if (!marker) {
      return Promise.resolve();
    }

    return dispatch(_getSearchObjects(bucketName, query, marker));
  };
}

export function continueSearchObjects(
  bucketName: string,
  query: string,
  type?: ListObjectsType,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { s3 } = getState();
    const listType = type || s3.listObjectsType;

    if (listType === LIST_OBJECT_VERSIONS_S3_TYPE) {
      return dispatch(_continueSearchVersions(bucketName, query));
    }

    return dispatch(_continueSearchObjectsNoVersions(bucketName, query));
  };
}

export function newSearchListing(
  bucketName: string,
  query: string,
  isVersioning: boolean,
): ThunkNonStatePromisedAction {
  return (dispatch: DispatchFunction) => {
    dispatch(networkStart(NETWORK_START_ACTION_STARTING_SEARCH));
    if (isVersioning) {
      return dispatch(_getSearchVersions(bucketName, query)).then(() =>
        dispatch(networkEnd()),
      );
    }
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
