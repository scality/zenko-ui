import { S3Action } from '../../types/actions';
import { List } from 'immutable';
import { S3State } from '../../types/state';
import { initialS3State } from './initialConstants';

const sortByDate = (objs) =>
  //@ts-expect-error fix this when you are working on it
  objs.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate));

const parseExpirationDate = (expiresOn: string | undefined): Date | null => {
  if (!expiresOn) {
    return null;
  }

  const extractExpirationDate = new RegExp(/expiry-date="([^"]+)"/);
  const regExpExecArray = extractExpirationDate.exec(expiresOn);
  if (regExpExecArray && regExpExecArray.length > 1) {
    return new Date(regExpExecArray[1]);
  }
  return null;
};

const parseRestoreOngoingRequest = (restore: string | undefined): boolean => {
  if (!restore) {
    return false;
  }
  const extractOngoingRequest = new RegExp(/ongoing-request="([^"]+)"/);
  const regExpExecArray = extractOngoingRequest.exec(restore);
  if (regExpExecArray && regExpExecArray.length > 1) {
    if (regExpExecArray[1] === 'false') {
      return false;
    } else if (regExpExecArray[1] === 'true') {
      return true;
    }
  }
  return false;
};

export const parseRestore = (
  restore: string | undefined,
): { ongoingRequest: boolean; expiryDate: Date | null } => {
  return {
    ongoingRequest: parseRestoreOngoingRequest(restore),
    expiryDate: parseExpirationDate(restore),
  };
};

export default function s3(state: S3State = initialS3State, action: S3Action) {
  switch (action.type) {
    case 'LIST_BUCKETS_SUCCESS':
      return {
        ...state,
        listBucketsResults: {
          list: List(sortByDate(action.list)),
          ownerName: action.ownerName,
        },
      };

    case 'GET_BUCKET_INFO_SUCCESS':
      return { ...state, bucketInfo: action.info };

    default:
      return state;
  }
}
