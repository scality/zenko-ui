import { initialBucketState } from './initialConstants';
export default function bucket(state = initialBucketState, action) {
  switch (action.type) {
    case 'UPDATE_BUCKET_LIST':
      return { ...state, list: action.list };

    default:
      return state;
  }
}