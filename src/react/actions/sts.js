// @flow
import { handleErrorMessage, listAccountAccessKeys, listBuckets, networkAuthFailure, searchWorkflows } from './index';
import type { ThunkStatePromisedAction } from '../../types/actions';
import { getClients } from '../utils/actions';


export function assumeRoleWithWebIdentity(roleArn: string): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { zenkoClient, stsClient, iamClient } = getClients(getState());
        const { oidc } = getState();
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
                    sessionToken: creds.Credentials.SessionToken,
                };
                zenkoClient.login(params);
                iamClient.init(params);
                return Promise.all([
                    dispatch(searchWorkflows()),
                    dispatch(listBuckets()),
                    dispatch(listAccountAccessKeys()),
                ]);
            })
            .catch(error => {
                const message = `Failed to return a valid set of temporary security credentials: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}
