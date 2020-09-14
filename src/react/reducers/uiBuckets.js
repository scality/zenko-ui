import { initialBucketUIState } from './initialConstants';

export default function uiBuckets(state = initialBucketUIState, action) {
    switch (action.type) {
    case 'OPEN_BUCKET_DELETE_DIALOG':
        return {
            ...state,
            showDelete: action.bucketName,
        };
    case 'CLOSE_BUCKET_DELETE_DIALOG':
        return {
            ...state,
            showDelete: '',
        };
    default:
        return state;
    }
}
