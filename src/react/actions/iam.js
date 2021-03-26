// @flow

import type { IAMClient as IAMClientInterface } from '../../types/iam';
import type { SetIAMClientAction } from '../../types/actions';

export function setIAMClient(iamClient: IAMClientInterface): SetIAMClientAction {
    return {
        type: 'SET_IAM_CLIENT',
        iamClient,
    };
}
