import S3Client from '../../js/S3Client';
import creds from '../../../creds';

export function createS3Client(client) {
    return {
        type:'CREATE_S3_CLIENT',
        client,
    };
}

export function initS3Client(){
    return (dispatch: DispatchFunction) => {
        const client = new S3Client({
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
        });
        dispatch(createS3Client(client));
    };
}
