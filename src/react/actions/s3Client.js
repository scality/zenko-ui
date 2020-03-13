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
            accessKey: 'TM2IJ7SQJ45VIMRWV14W',
            secretKey: '4xqazjiGUIh0LOXFk1LH1TBVES8ZLezkV31MvwMc',
        });
        dispatch(createS3Client(client));
    };
}
