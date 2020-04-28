import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';

export function listAcountsSuccess(body) {
    return {
        type: 'LIST_ACCOUNTS_SUCCESS',
        list: body.accounts,
        isTruncated: !!body.isTruncated,
        marker: body.marker,
    };
}

export function listAccounts(maxItems, marker) {
    return (dispatch, getState) => {
        const { apiClient, instanceId } = getClients(getState());
        dispatch(networkStart('Listing accounts'));
        console.log('maxItems!!!', maxItems);
        console.log('marker!!!', marker);
        apiClient.listAccounts({ maxItems, marker })
            .then(resp => {
                dispatch(listAcountsSuccess(resp.body));
                console.log('resp!!!', resp);
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
