// @flow

import type { DispatchFunction,
    GetStateFunction,
    SetZenkoClientAction,
    ThunkNonStatePromisedAction,
    ThunkStatePromisedAction,
    ZenkoErrorAction,
} from '../../types/actions';
import type { Marker,
    SearchBucketResp,
    SearchResultList,
    ZenkoClientError,
    ZenkoClient as ZenkoClientInterface,
    ZenkoErrorType } from '../../types/zenko';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';

export function zenkoClearError(): ZenkoClearAction {
    return {
        type: 'ZENKO_CLEAR_ERROR',
    };
}

export function zenkoHandleError(error: ZenkoClientError, target: string | null, type: ZenkoErrorType): ZenkoErrorAction {
    return {
        type: 'ZENKO_HANDLE_ERROR',
        errorMsg: error.message || null,
        errorCode: error.code || null,
        errorType: type,
        errorTarget: target,
    };
}

export function writeSearchListing(nextMarker: Marker, prefixWithSlash: string, list: SearchResultList): ZenkoWriteSearchListAction {
    return {
        type: 'ZENKO_CLIENT_WRITE_SEARCH_LIST',
        nextMarker,
        prefixWithSlash,
        list,
    };
}

export function appendSearchListing(nextMarker: Marker, prefixWithSlash: string, list: SearchResultList): ZenkoAppendSearchListAction {
    return {
        type: 'ZENKO_CLIENT_APPEND_SEARCH_LIST',
        nextMarker,
        prefixWithSlash,
        list,
    };
}

export function setZenkoClient(zenkoClient: ZenkoClientInterface): SetZenkoClientAction {
    return {
        type: 'SET_ZENKO_CLIENT',
        zenkoClient,
    };
}

// function _isFolder(key: string): boolean {
//     return key.substr(key.length - 1) === '/';
// }

function _getFolderName(key: string, prefix: string): ({ folderName: string, isFolder: boolean }) {
    const splits = key.replace(prefix, '').split('/');
    return { folderName: `${splits[0]}/`, isFolder: splits.length > 1 };
}


function _getSearchObjects(bucketName: string, prefixWithSlash: string, query: string, marker?: Marker): ThunkStatePromisedAction {
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
        const { zenkoClient } = getClients(getState());
        const params = {
            Bucket: bucketName,
            Query: query,
            Marker: marker ? marker : (void 0),
        };
        dispatch(zenkoClearError());
        dispatch(networkStart('Searching objects'));
        return zenkoClient.searchBucket(params)
            .then(({ IsTruncated, NextMarker, Contents }: SearchBucketResp) => {
                const nextMarker = IsTruncated && NextMarker || null;
                const list = Contents;
                list.forEach(object => {
                    const { folderName, isFolder } = _getFolderName(object.Key, prefixWithSlash);
                    object.IsFolder = isFolder;
                    if (!object.IsFolder) {
                        object.SignedUrl = zenkoClient.getObjectSignedUrl(bucketName, object.Key);
                    } else {
                        object.Key = folderName;
                    }
                });
                if (marker) {
                    dispatch(appendSearchListing(nextMarker, prefixWithSlash, list));
                } else {
                    dispatch(writeSearchListing(nextMarker, prefixWithSlash, list));
                }
            })
            .catch(err => dispatch(zenkoHandleError(err, null, null)))
            .finally(() => dispatch(networkEnd()));
    };
}

export function newSearchListing(bucketName: string, prefixWithSlash: string, q: string): ThunkNonStatePromisedAction {
    return (dispatch: DispatchFunction) => {
        dispatch(networkStart('Starting search'));
        let query = q
        if (prefixWithSlash) {
            query = `key like ${prefixWithSlash} AND ${q}`;
        }
        return dispatch(_getSearchObjects(bucketName, prefixWithSlash, query))
            .then(() => dispatch(networkEnd()));
    };
}

export function continueSearchListing(bucketName: string, prefixWithSlash: string, query: string): ThunkStatePromisedAction {
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
        const { zenkoClient } = getClients(getState());
        const marker = zenkoClient.searchResults.nextMarker;

        if (!marker) {
            return Promise.resolve();
        }

        dispatch(networkStart('continue search'));
        return dispatch(_getSearchObjects(bucketName, prefixWithSlash, query, marker))
            .then(() => dispatch(networkEnd()));
    };
}
