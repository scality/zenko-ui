// @flow

import type {DispatchFunction} from '../../types/actions';
import IAMClient from '../../js/IAMClient';
import type {ZenkoClient} from '../../types/state';
import creds from '../../../creds';

export function createIamClient(client: ZenkoClient) {
    return {
        type:'CREATE_IAM_CLIENT',
        client,
    };
}

export function initIamClient(){
    return (dispatch: DispatchFunction) => {
        const client = new IAMClient({
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
        });
        dispatch(createIamClient(client));
    };
}
