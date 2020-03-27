export default function uiBucket(state = { showDelete: false }, action) {
    switch (action.type) {
    case 'SELECT_BUCKET':
        return {
            ...state,
            selectedBucketName: action.bucketName,
        };
    case 'RESET_SELECT_BUCKET':
        return {
            ...state,
            selectedBucketName: null,
        };
    case 'OPEN_BUCKET_DELETE_DIALOG':
        return {
            ...state,
            showDelete: true,
        };
    case 'CLOSE_BUCKET_DELETE_DIALOG':
        return {
            ...state,
            showDelete: false,
        };
    default:
        return state;
    }
}
