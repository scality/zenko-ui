import { handleApiError, handleClientError } from './error';
import {loadInstanceLatestStatus, loadInstanceStats} from './stats';
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

function getAuth() {
    return new Promise((resolve) => {
        return resolve({
            instanceId: creds.instanceId,
            oidcToken: 'oidc',
        });
    });
}

export function loadCredentials() {
    return dispatch => {
        return getAuth()
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
                        accessKey: 'BX0SXCJ0N8VJAGDVJSYA',
                        secretKey: 'RWUmQUjru0qcidHl+FwF0w=rnxAwX=SB5ngywFfX',
                    }),
                ]);
            })
            .then(([instanceId, pensieveClient, iamClient, s3Client]) => {
                dispatch(login(instanceId, {pensieveClient, iamClient, s3Client}));
                return Promise.all([
                    dispatch(loadInstanceLatestStatus()),
                    dispatch(loadInstanceStats()),
                ]);
            })
            .then(() => {})
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
