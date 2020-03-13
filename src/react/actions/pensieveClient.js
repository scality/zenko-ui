import { handleApiError, handleClientError } from './error';
import creds from '../../../creds';
import { loadInstanceStats } from './stats';
import makePensieveClient from '../../js/pensieveClient';
import { updateConfiguration} from './configuration';

const apiEndpoint = 'http://127.0.0.1:5000';
const instanceId = creds.instanceId;

export function createPensieveClient(client) {
    return {
        type:'CREATE_PENSIEVE_CLIENT',
        client,
    };
}

export function initPensieveClient(){
    return dispatch => {
        return Promise.resolve(makePensieveClient(apiEndpoint, instanceId))
            .then(client => {
                dispatch(createPensieveClient(client));
                dispatch(loadInstanceStats());
                dispatch(updateConfiguration());
                // dispatch(loadInstanceStats());
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

// export function loadInstanceStats(){
//     return (dispatch, getState) => {
//         const client = getState().pensieveClient.client;
//         return client.getInstanceStats({ uuid: instanceId})
//             .then(res => {
//                 console.log('getInstanceStats => res!!!', res);
//             })
//             .catch(error => dispatch(handleClientError(error)))
//             .catch(error => dispatch(handleApiError(error, 'byModal')));
//     };
// }
