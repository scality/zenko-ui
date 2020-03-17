//@noflow

import S3Client from '../../js/S3Client';
import creds from '../../../creds';

export function createS3Client(client) {
    return {
        type:'CREATE_S3_CLIENT',
        client,
    };
}

export function initS3Client(){
    return (dispatch) => {
        const client = new S3Client({
            accessKey: '4GCO5LBINTODY8XQ9OZK',
            secretKey: '7I6U/681cVJEiMn=pXr0ml2qLlMchzkVaC23V=ga',
        });
        dispatch(createS3Client(client));
    };
}
