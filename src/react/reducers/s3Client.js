export default function s3Client(state = {}, action){
    switch (action.type) {
    case 'CREATE_S3_CLIENT':
        return {
            ...state,
            client: action.client,
        };
    default:
        return state;
    }
}
