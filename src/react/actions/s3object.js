// @flow
import type {
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
import type {
  CommonPrefix,
  DeleteFolder,
  File,
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
import { handleAWSClientError, handleAWSError } from './error';
import { networkEnd, networkStart } from './network';
import { LIST_OBJECT_VERSIONS_S3_TYPE } from '../utils/s3';
import type { Marker, ZenkoClient } from '../../types/zenko';
import { getClients } from '../utils/actions';

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
  ObjectRetention: {|
    Mode: RetentionMode,
    RetainUntilDate: Date,
  |},
): GetObjectMetadataSuccessAction {
  return {
    type: 'GET_OBJECT_METADATA_SUCCESS',
    bucketName,
    objectKey,
    info,
    tags,
    ObjectRetention,
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
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Creating folder'));
    return zenkoClient
      .createFolder(bucketName, prefixWithSlash, folderName)
      .then(() => dispatch(listObjects(bucketName, prefixWithSlash)))
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => {
        dispatch(networkEnd());
        dispatch(closeFolderCreateModal());
      });
  };
}

function _getObjectListWithSignedUrlAndLockStatus<
  T: {| +Key: string, +VersionId?: string |},
>(
  zenkoClient: ZenkoClient,
  bucketName: string,
  list: T[],
): Promise<
  (T & {|
    +SignedUrl: string,
    +ObjectRetention?: {|
      +Mode: RetentionMode,
      +RetainUntilDate: string,
    |},
  |})[],
> {
  // $FlowFixMe - flow is not able to understand this type
  return Promise.all(
    list.map(async object => {
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
      .then(async res => {
        // $FlowFixMe - flow is not able to understand await resulting type
        const list: S3Object[] = await _getObjectListWithSignedUrlAndLockStatus<S3Object>(
          zenkoClient,
          bucketName,
          res.Contents,
        );
        if (marker) {
          return dispatch(
            continueListObjectsSuccess(
              list,
              res.CommonPrefixes,
              res.Prefix,
              res.NextContinuationToken,
            ),
          );
        }
        return dispatch(
          listObjectsSuccess(
            list,
            res.CommonPrefixes,
            res.Prefix,
            res.NextContinuationToken,
          ),
        );
      })
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}

function _listObjectNoVersion(
  bucketName: string,
  prefixWithSlash: string,
): ThunkNonStatePromisedAction {
  return dispatch => {
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
      .then(async res => {
        // $FlowFixMe - flow is not able to understand await resulting type
        const list = await _getObjectListWithSignedUrlAndLockStatus<S3Version>(
          zenkoClient,
          bucketName,
          res.Versions,
        );
        if (marker) {
          return dispatch(
            continueListObjectVersionsSuccess(
              list,
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
            res.DeleteMarkers,
            res.CommonPrefixes,
            res.Prefix,
            res.NextKeyMarker,
            res.NextVersionIdMarker,
          ),
        );
      })
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}

function _listObjectVersions(
  bucketName: string,
  prefixWithSlash: string,
): ThunkNonStatePromisedAction {
  return dispatch => {
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
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(closeObjectUploadModal());
    dispatch(networkStart('Uploading object(s)'));
    return zenkoClient
      .uploadObject(bucketName, prefixWithSlash, files)
      .then(() => dispatch(listObjects(bucketName, prefixWithSlash)))
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byComponent')))
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
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byModal')))
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
    ])
      .then(([info, tags, objectRetention]) =>
        dispatch(
          getObjectMetadataSuccess(
            bucketName,
            objectKey,
            info,
            tags.TagSet,
            objectRetention,
          ),
        ),
      )
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byComponent')))
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
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byModal')))
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
      .catch(error => dispatch(handleAWSClientError(error)))
      .catch(error => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
