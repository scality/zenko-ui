import { handleApiError, handleClientError, listBuckets, listUsers, loadInstanceLatestStatus, loadInstanceStats} from './';
import IAMClient from '../../js/IAMClient';
import S3Client from '../../js/S3Client';
import creds from '../../../creds';
import makePensieveClient from '../../js/pensieveClient';

const apiEndpoint = 'http://127.0.0.1:5000';

export function login(instanceId, clients) {
    return {
        type: 'LOG_IN',
        instanceId,
        clients,
    };
}

// function getConfig() {
//     return new Promise((resolve) => {
//         return resolve({
//             instanceId: creds.instanceId,
//             oidcToken: 'oidc',
//         });
//     });
// }

function getConfig() {
    return fetch('/config.json', { credentials: 'same-origin' })
        .then(response => { console.log('response!!!', response); return response.json(); })
        .then((jsonResp) => {
            console.log('jsonResp!!!', jsonResp);
            return {
                instanceId: creds.instanceId,
                oidcToken: 'oidc',
            };
        });
}

export function loadCredentials() {
    return dispatch => {
        return getConfig()
            .then((resp) => {
                return Promise.all([
                    resp.instanceId,
                    // TODO: use oidc token
                    makePensieveClient(apiEndpoint, resp.instanceId),
                    new IAMClient({
                        accessKey: creds.accessKey,
                        secretKey: creds.secretKey,
                    }),
                    new S3Client({
                        // MADEUP KEYS
                        accessKey: 'GS8DHPT3K9BNZ1JGR9YO',
                        secretKey: 'VfkJmYyHLG+G1QRTb7OkgvqlglB+EMeYyHDJ+Q5F',
                    }),
                ]);
            })
            .then(([instanceId, pensieveClient, iamClient, s3Client]) => {
                dispatch(login(instanceId, {pensieveClient, iamClient, s3Client}));
                return Promise.all([
                    dispatch(loadInstanceLatestStatus()),
                    dispatch(loadInstanceStats()),
                    dispatch(listBuckets()),
                    dispatch(listUsers()),
                ]);
            })
            .then(() => {})
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
