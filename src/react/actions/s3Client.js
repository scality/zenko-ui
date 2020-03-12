//@noflow

import S3Client from '../../js/S3Client';
// import creds from '../../../creds';

export function createS3Client(client) {
    return {
        type:'CREATE_S3_CLIENT',
        client,
    };
}

export function initS3Client(){
    return (dispatch) => {
        const client = new S3Client({
            accessKey: 'accessKey1',
            secretKey: 'verySecretKey1',
        });
        dispatch(createS3Client(client));
    };
}
