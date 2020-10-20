// @flow
import type { SetZenkoClientAction } from '../../types/actions';
import type { ZenkoClient as ZenkoClientInterface } from '../../types/zenko';

export function setZenkoClient(zenkoClient: ZenkoClientInterface): SetZenkoClientAction {
    return {
        type: 'SET_ZENKO_CLIENT',
        zenkoClient,
    };
}
