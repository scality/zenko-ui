import { BucketInfo, ObjectLockRetentionSettings } from '../../types/s3';
import {
  CloseBucketDeleteDialogAction,
  GetBucketInfoSuccessAction,
  OpenBucketDeleteDialogAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import { handleAWSClientError, handleAWSError } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';
import { History } from 'history';

export function getBucketInfoSuccess(
  info: BucketInfo,
): GetBucketInfoSuccessAction {
  return {
    type: 'GET_BUCKET_INFO_SUCCESS',
    info,
  };
}
export function openBucketDeleteDialog(
  bucketName: string,
): OpenBucketDeleteDialogAction {
  return {
    type: 'OPEN_BUCKET_DELETE_DIALOG',
    bucketName,
  };
}
export function closeBucketDeleteDialog(): CloseBucketDeleteDialogAction {
  return {
    type: 'CLOSE_BUCKET_DELETE_DIALOG',
  };
}

export function getBucketInfo(bucketName: string): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Getting bucket information'));
    return (
      zenkoClient
        .getBucketInfo(bucketName)
        //@ts-expect-error fix this when you are working on it
        .then((info) => dispatch(getBucketInfoSuccess(info)))
        .catch((error) => dispatch(handleAWSClientError(error)))
        .catch((error) => dispatch(handleAWSError(error, 'byComponent')))
        .finally(() => dispatch(networkEnd()))
    );
  };
}
export function toggleBucketVersioning(
  bucketName: string,
  isVersioning: boolean,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Versioning bucket'));
    return zenkoClient
      .toggleVersioning(bucketName, isVersioning)
      .then(() => dispatch(getBucketInfo(bucketName)))
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function editDefaultRetention(
  bucketName: string,
  objectLockRetentionSettings: ObjectLockRetentionSettings,
  history: History,
): ThunkStatePromisedAction {
  return async (dispatch, getState) => {
    // TODO: credentials expired => zenkoClient out of date => zenkoClient.createBucket error.
    const { zenkoClient } = getClients(getState());
    dispatch(networkStart('Editing bucket default retention'));

    try {
      await zenkoClient.putObjectLockConfiguration({
        ...objectLockRetentionSettings,
        bucketName,
      });
    } catch (maybeAuthError) {
      try {
        dispatch(handleAWSClientError(maybeAuthError));
      } catch (originalError) {
        dispatch(handleAWSError(originalError, 'byComponent'));
      }

      dispatch(networkEnd());
      return;
    }

    history.push('/buckets');
    await dispatch(networkEnd());
  };
}
