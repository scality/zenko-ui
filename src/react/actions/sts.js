// @flow

import { handleErrorMessage, listBuckets, networkAuthFailure } from './index';
import type { ThunkStatePromisedAction } from '../../types/actions';
import { getClients } from '../utils/actions';


export function assumeRoleWithWebIdentity(role?: string): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { zenkoClient, stsClient } = getClients(getState());
        const { oidc, configuration } = getState();
        let roleArn = role;
        if (!role) {
            if (configuration.latest.users.length === 0) {
                // clean S3 client and buckets' list if no account.
                zenkoClient.logout();
                return Promise.resolve();
            }
            // TODO: which one should we pick?`
            roleArn = `arn:aws:iam::${configuration.latest.users[0].id}:role/roleForB`;
        }
        const assumeRoleParams = {
            idToken: oidc.user.id_token,
            RoleSessionName:'app1',
            roleArn,
        };
        return stsClient.assumeRoleWithWebIdentity(assumeRoleParams)
            .then(creds => {
                const params = {
                    accessKey: creds.Credentials.AccessKeyId,
                    secretKey: creds.Credentials.SecretAccessKey,
                    // TODO: to be uncommented once sessionToken is implemented in Vault STS.
                    // sessionToken: creds.Credentials.SessionToken,
                };
                zenkoClient.login(params);
                return dispatch(listBuckets());
            })
            .catch(error => {
                const message = `Failed to return a valid set of temporary security credentials: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}
