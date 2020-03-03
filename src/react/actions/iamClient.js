// @flow

import type {DispatchFunction} from '../../types/actions';
import IAMClient from '../../js/IAMClient';
import type {IAMClientType} from '../../types/state';
import creds from '../../../creds';

export function createIamClient(client: IAMClientType) {
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
