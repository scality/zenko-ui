import { History } from 'history';
import {
  CloseFolderCreateModalAction,
  CloseObjectDeleteModalAction,
  CloseObjectUploadModalAction,
  ContinueListObjectVersionsSuccessAction,
  ContinueListObjectsSuccessAction,
  GetObjectMetadataSuccessAction,
  ListObjectVersionsSuccessAction,
  ListObjectsSuccessAction,
  OpenFolderCreateModalAction,
  OpenObjectDeleteModalAction,
  OpenObjectUploadModalAction,
  ResetObjectMetadataAction,
  ThunkNonStatePromisedAction,
  ThunkStatePromisedAction,
  ToggleAllObjectsAction,
  ToggleObjectAction,
} from '../../types/actions';
import {
  CommonPrefix,
  DeleteFolder,
  HeadObjectResponse,
  ListObjectsType,
  MetadataPairs,
  RetentionMode,
  S3DeleteMarker,
  S3DeleteObject,
  S3Object,
  S3Version,
  TagSet,
} from '../../types/s3';
import {
  handleAWSClientError,
  handleAWSError,
  handleErrorMessage,
} from './error';
import { networkEnd, networkStart } from './network';
import { LIST_OBJECT_VERSIONS_S3_TYPE } from '../utils/s3';
import { Marker, ZenkoClient } from '../../types/zenko';
import { getClients } from '../utils/actions';
import { newSearchListing } from '.';
import { QueryClient } from 'react-query';

export const UPLOADING_OBJECT = 'Uploading object(s)';
export function listObjectsSuccess(
  contents: Array<S3Object>,
  commonPrefixes: Array<CommonPrefix>,
  prefix: string,
  nextContinuationToken: Marker,
): ListObjectsSuccessAction {
  return {
    type: 'LIST_OBJECTS_SUCCESS',
    contents,
    commonPrefixes,
    prefix,
    nextMarker: nextContinuationToken,
  };
}
export function continueListObjectsSuccess(
  contents: Array<S3Object>,
  commonPrefixes: Array<CommonPrefix>,
  prefix: string,
  nextContinuationToken: Marker,
): ContinueListObjectsSuccessAction {
  return {
    type: 'CONTINUE_LIST_OBJECTS_SUCCESS',
    contents,
    commonPrefixes,
    prefix,
    nextMarker: nextContinuationToken,
  };
}
export function listObjectVersionsSuccess(
  versions: Array<S3Version>,
  deleteMarkers: Array<S3DeleteMarker>,
  commonPrefixes: Array<CommonPrefix>,
  prefix: string,
  nextKeyMarker: Marker,
  nextVersionIdMarker: Marker,
): ListObjectVersionsSuccessAction {
  return {
    type: 'LIST_OBJECT_VERSIONS_SUCCESS',
    versions,
    deleteMarkers,
    commonPrefixes,
    prefix,
    nextMarker: nextKeyMarker,
    nextVersionIdMarker: nextVersionIdMarker,
  };
}
export function continueListObjectVersionsSuccess(
  versions: Array<S3Version>,
  deleteMarkers: Array<S3DeleteMarker>,
  commonPrefixes: Array<CommonPrefix>,
  prefix: string,
  nextKeyMarker: Marker,
  nextVersionIdMarker: Marker,
): ContinueListObjectVersionsSuccessAction {
  return {
    type: 'CONTINUE_LIST_OBJECT_VERSIONS_SUCCESS',
    versions,
    deleteMarkers,
    commonPrefixes,
    prefix,
    nextMarker: nextKeyMarker,
    nextVersionIdMarker: nextVersionIdMarker,
  };
}
export function getObjectMetadataSuccess(
  bucketName: string,
  objectKey: string,
  info: HeadObjectResponse,
  tags: TagSet,
  ObjectRetention: {
    Mode: RetentionMode;
    RetainUntilDate: Date;
  },
  isLegalHoldEnabled: boolean,
): GetObjectMetadataSuccessAction {
  return {
    type: 'GET_OBJECT_METADATA_SUCCESS',
    bucketName,
    objectKey,
    info,
    tags,
    ObjectRetention,
    isLegalHoldEnabled,
  };
}
export function openFolderCreateModal(): OpenFolderCreateModalAction {
  return {
    type: 'OPEN_FOLDER_CREATE_MODAL',
  };
}
export function closeFolderCreateModal(): CloseFolderCreateModalAction {
  return {
    type: 'CLOSE_FOLDER_CREATE_MODAL',
  };
}
export function openObjectUploadModal(): OpenObjectUploadModalAction {
  return {
    type: 'OPEN_OBJECT_UPLOAD_MODAL',
  };
}
export function closeObjectUploadModal(): CloseObjectUploadModalAction {
  return {
    type: 'CLOSE_OBJECT_UPLOAD_MODAL',
  };
}
export function openObjectDeleteModal(): OpenObjectDeleteModalAction {
  return {
    type: 'OPEN_OBJECT_DELETE_MODAL',
  };
}
export function closeObjectDeleteModal(): CloseObjectDeleteModalAction {
  return {
    type: 'CLOSE_OBJECT_DELETE_MODAL',
  };
}
export function toggleObject(
  objectKey: string,
  versionId?: string,
): ToggleObjectAction {
  return {
    type: 'TOGGLE_OBJECT',
    objectKey,
    versionId,
  };
}
export function toggleAllObjects(toggled: boolean): ToggleAllObjectsAction {
  return {
    type: 'TOGGLE_ALL_OBJECTS',
    toggled,
  };
}
export function resetObjectMetadata(): ResetObjectMetadataAction {
  return {
    type: 'RESET_OBJECT_METADATA',
  };
}

export function createFolder(
  bucketName: string,
  prefixWithSlash: string,
  folderName: string,
  queryClient: QueryClient,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Creating folder'));
    return zenkoClient
      .createFolder(bucketName, prefixWithSlash, folderName)
      .then(() => {
        queryClient.removeQueries(['objectVersions', bucketName]);
        dispatch(listObjects(bucketName, prefixWithSlash));
      })
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => {
        dispatch(networkEnd());
        dispatch(closeFolderCreateModal());
      });
  };
}

function _getObjectListWithSignedUrlAndLockStatus<
  T extends {
    readonly Key: string;
    readonly VersionId?: string;
  },
>(
  zenkoClient: ZenkoClient,
  bucketName: string,
  list: T[],
): Promise<
  (T & {
    readonly SignedUrl: string;
    readonly ObjectRetention?: {
      readonly Mode: RetentionMode;
      readonly RetainUntilDate: string;
    };
  })[]
> {
  //@ts-expect-error fix this when you are working on it
  return Promise.all(
    list.map(async (object) => {
      return {
        ...object,
        SignedUrl: await zenkoClient.getObjectSignedUrl(
          bucketName,
          object.Key,
          object.VersionId,
        ),
        ObjectRetention: await zenkoClient.getObjectRetention(
          bucketName,
          object.Key,
          object.VersionId,
        ),
        IsLegalHoldEnabled: await zenkoClient.getObjectLegalHold(
          bucketName,
          object.Key,
          object.VersionId,
        ),
      };
    }),
  );
}

function _getListObjectNoVersion(
  bucketName: string,
  prefixWithSlash: string,
  marker?: Marker,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Fetching objects'));
    const params = {
      Bucket: bucketName,
      Prefix: prefixWithSlash,
      ContinuationToken: marker ? marker : void 0,
    };
    return zenkoClient
      .listObjects(params)
      .then(async (res) => {
        const list: S3Object[] =
          await _getObjectListWithSignedUrlAndLockStatus<S3Object>(
            zenkoClient,
            bucketName,
            //@ts-expect-error fix this when you are working on it
            res.Contents,
          );

        if (marker) {
          return dispatch(
            continueListObjectsSuccess(
              list,
              //@ts-expect-error fix this when you are working on it
              res.CommonPrefixes,
              res.Prefix,
              res.NextContinuationToken,
            ),
          );
        }

        return dispatch(
          listObjectsSuccess(
            list,
            //@ts-expect-error fix this when you are working on it
            res.CommonPrefixes,
            res.Prefix,
            res.NextContinuationToken,
          ),
        );
      })
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}

function _listObjectNoVersion(
  bucketName: string,
  prefixWithSlash: string,
): ThunkNonStatePromisedAction {
  return (dispatch) => {
    return dispatch(_getListObjectNoVersion(bucketName, prefixWithSlash));
  };
}

function _continueListObjectNoVersion(
  bucketName: string,
  prefixWithSlash: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { s3 } = getState();
    const marker = s3.listObjectsResults.nextMarker;

    if (!marker) {
      return Promise.resolve();
    }

    return dispatch(
      _getListObjectNoVersion(bucketName, prefixWithSlash, marker),
    );
  };
}

export function listObjects(
  bucketName: string,
  prefixWithSlash: string,
  type?: ListObjectsType,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { s3 } = getState();
    const listType = type || s3.listObjectsType;

    if (listType === LIST_OBJECT_VERSIONS_S3_TYPE) {
      return dispatch(_listObjectVersions(bucketName, prefixWithSlash));
    }

    return dispatch(_listObjectNoVersion(bucketName, prefixWithSlash));
  };
}

function _getListObjectVersion(
  bucketName: string,
  prefixWithSlash: string,
  marker?: Marker,
  versionIdMarker?: Marker,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Fetching object versions'));
    const params = {
      Bucket: bucketName,
      Prefix: prefixWithSlash,
      KeyMarker: marker ? marker : void 0,
      VersionIdMarker: versionIdMarker ? versionIdMarker : void 0,
    };
    return zenkoClient
      .listObjectVersions(params)
      .then(async (res) => {
        const list = await _getObjectListWithSignedUrlAndLockStatus<S3Version>(
          zenkoClient,
          bucketName,
          //@ts-expect-error fix this when you are working on it
          res.Versions,
        );

        if (marker) {
          return dispatch(
            continueListObjectVersionsSuccess(
              list,
              //@ts-expect-error fix this when you are working on it
              res.DeleteMarkers,
              res.CommonPrefixes,
              res.Prefix,
              res.NextKeyMarker,
              res.NextVersionIdMarker,
            ),
          );
        }

        return dispatch(
          listObjectVersionsSuccess(
            list,
            //@ts-expect-error fix this when you are working on it
            res.DeleteMarkers,
            res.CommonPrefixes,
            res.Prefix,
            res.NextKeyMarker,
            res.NextVersionIdMarker,
          ),
        );
      })
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}

function _listObjectVersions(
  bucketName: string,
  prefixWithSlash: string,
): ThunkNonStatePromisedAction {
  return (dispatch) => {
    return dispatch(_getListObjectVersion(bucketName, prefixWithSlash));
  };
}

function _continueListObjectVersions(
  bucketName: string,
  prefixWithSlash: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { s3 } = getState();
    const marker = s3.listObjectsResults.nextMarker;
    const versionIdMarker = s3.listObjectsResults.nextVersionIdMarker;

    if (!marker || !versionIdMarker) {
      return Promise.resolve();
    }

    return dispatch(
      _getListObjectVersion(
        bucketName,
        prefixWithSlash,
        marker,
        versionIdMarker,
      ),
    );
  };
}

export function continueListObjects(
  bucketName: string,
  prefixWithSlash: string,
  type?: ListObjectsType,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { s3 } = getState();
    const listType = type || s3.listObjectsType;

    if (listType === LIST_OBJECT_VERSIONS_S3_TYPE) {
      return dispatch(_continueListObjectVersions(bucketName, prefixWithSlash));
    }

    return dispatch(_continueListObjectNoVersion(bucketName, prefixWithSlash));
  };
}
export function uploadFiles(
  bucketName: string,
  prefixWithSlash: string,
  files: Array<File>,
  queryClient: QueryClient,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(closeObjectUploadModal());
    dispatch(networkStart(UPLOADING_OBJECT));
    return zenkoClient
      .uploadObject(bucketName, prefixWithSlash, files)
      .then(() => {
        queryClient.removeQueries(['objectVersions', bucketName]);
        dispatch(listObjects(bucketName, prefixWithSlash));
      })
      .catch((error) => {
        dispatch(handleAWSClientError(error));
      })
      .catch((error) => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function deleteFiles(
  bucketName: string,
  prefixWithSlash: string,
  objects: Array<S3DeleteObject>,
  folders: Array<DeleteFolder>,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(closeObjectDeleteModal());
    dispatch(networkStart('Deleting object(s)'));
    return zenkoClient
      .deleteObjects(bucketName, objects, folders)
      .catch((error) => {
        // S3 API return 200 response code with Access Denied Error
        if (
          error &&
          error.Errors &&
          error.Errors.some((error) => error.Code === 'AccessDenied')
        ) {
          const str = 'You do not have the permission to perform this action.';
          dispatch(handleErrorMessage(str, 'byModal'));
        } else {
          dispatch(handleAWSClientError(error));
        }
      })
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => {
        dispatch(networkEnd());
        // make sure to list objects even if delete fails.
        return dispatch(listObjects(bucketName, prefixWithSlash));
      });
  };
}
export function getObjectMetadata(
  bucketName: string,
  objectKey: string,
  versionId?: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Getting object metadata'));
    return Promise.all([
      zenkoClient.headObject(bucketName, objectKey, versionId),
      zenkoClient.getObjectTagging(bucketName, objectKey, versionId),
      zenkoClient.getObjectRetention(bucketName, objectKey, versionId),
      zenkoClient.getObjectLegalHold(bucketName, objectKey, versionId),
    ])
      .then(([info, tags, objectRetention, isLegalHoldEnabled]) =>
        dispatch(
          getObjectMetadataSuccess(
            bucketName,
            objectKey,
            //@ts-expect-error fix this when you are working on it
            info,
            tags.TagSet,
            objectRetention,
            isLegalHoldEnabled,
          ),
        ),
      )
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function putObjectMetadata(
  bucketName: string,
  objectKey: string,
  systemMetadata: MetadataPairs,
  userMetadata: MetadataPairs,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Getting object metadata'));
    return zenkoClient
      .putObjectMetadata(bucketName, objectKey, systemMetadata, userMetadata)
      .then(() => dispatch(getObjectMetadata(bucketName, objectKey)))
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function putObjectTagging(
  bucketName: string,
  objectKey: string,
  tags: TagSet,
  versionId: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Getting object tags'));
    return zenkoClient
      .putObjectTagging(bucketName, objectKey, tags, versionId)
      .then(() => dispatch(getObjectMetadata(bucketName, objectKey, versionId)))
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function putObjectLegalHold(
  bucketName: string,
  objectKey: string,
  versionId: string,
  isLegalHold: boolean,
  prefixWithSlash: string,
  metadataSearch?: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Getting object legal hold'));
    return zenkoClient
      .putObjectLegalHold(bucketName, objectKey, versionId, isLegalHold)
      .then(() => {
        if (!metadataSearch) {
          dispatch(listObjects(bucketName, prefixWithSlash));
        } else {
          //@ts-expect-error fix this when you are working on it
          dispatch(newSearchListing(bucketName, metadataSearch));
        }
      })
      .then(() => dispatch(getObjectMetadata(bucketName, objectKey, versionId)))
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function putObjectRetention(
  bucketName: string,
  objectName: string,
  versionId: string,
  retentionMode: RetentionMode,
  retentionUntilDate: Date,
  accountName: string,
  history: History,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Editing object retention'));
    return zenkoClient
      .putObjectRetention(
        bucketName,
        objectName,
        versionId,
        retentionMode,
        retentionUntilDate,
      )
      .then(() => {
        history.push(
          `/accounts/${accountName}/buckets/${bucketName}/objects?prefix=${objectName}`,
        );
      })
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
