// @flow

import { handleErrorMessage, listBuckets, networkAuthFailure, setS3Client } from './index';
import S3Client from '../../js/S3Client';
import type { ThunkStatePromisedAction } from '../../types/actions';


export function assumeRoleWithWebIdentity(role?: string): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { oidc, auth: { config, stsClient }, configuration } = getState();
        let roleArn = role;
        if (!role) {
            if (configuration.latest.users.length === 0) {
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
                const s3Params = {
                    endpoint: config.s3Endpoint,
                    accessKey: creds.Credentials.AccessKeyId,
                    secretKey: creds.Credentials.SecretAccessKey,
                    // TODO: to be uncommented once sessionToken is implemented in Vault STS.
                    // sessionToken: creds.Credentials.SessionToken,
                };
                const s3Client = new S3Client(s3Params);
                dispatch(setS3Client(s3Client));
                return dispatch(listBuckets());
            })
            .catch(error => {
                const message = `Failed to return a valid set of temporary security credentials: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}
