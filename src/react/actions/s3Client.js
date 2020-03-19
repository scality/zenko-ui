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
            // MADEUP KEYS
            accessKey: 'BX0SXCJ0N8VJAGDVJSYA',
            secretKey: 'RWUmQUjru0qcidHl+FwF0w=rnxAwX=SB5ngywFfX',
        });
        dispatch(createS3Client(client));
    };
}
