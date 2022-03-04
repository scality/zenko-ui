import type { BucketsUIAction } from '../../types/actions';
import type { BucketsUIState } from '../../types/state';
import { initialBucketUIState } from './initialConstants';
export default function uiBuckets(
  state: BucketsUIState = initialBucketUIState,
  action: BucketsUIAction,
) {
  switch (action.type) {
    case 'OPEN_BUCKET_DELETE_DIALOG':
      return { ...state, showDelete: action.bucketName };

    case 'CLOSE_BUCKET_DELETE_DIALOG':
      return { ...state, showDelete: '' };

    default:
      return state;
  }
}