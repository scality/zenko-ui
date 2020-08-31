// @flow

import { handleErrorMessage, listBuckets, networkAuthFailure, setS3Client } from './index';
import S3Client from '../../js/S3Client';
import STSClient from '../../js/STSClient';
import type { ThunkStateAction } from '../../types/actions';


export function assumeRoleWithWebIdentity(role?: string): ThunkStateAction {
    return (dispatch, getState) => {
        const { oidc, auth: { config }, configuration } = getState();
        let roleArn = role;
        if (!role) {
            if (configuration.latest.users.length === 0) {
                return;
            }
            // TODO: which one should we pick?`
            roleArn = `arn:aws:iam::${configuration.latest.users[0].id}:role/roleForB`;
        }
        const sts = new STSClient({ endpoint: config.stsEndpoint });
        const assumeRoleParams = {
            idToken: oidc.user.id_token,
            RoleSessionName:'app1',
            // roleArn will not be hardcoded but discovered from user's role.
            // roleArn: 'arn:aws:iam::236423648091:role/zenko-ui-role',
            roleArn,
        };
        return sts.assumeRoleWithWebIdentity(assumeRoleParams)
            .then(creds => {
                const s3Params = {
                    accessKey: creds.Credentials.AccessKeyId,
                    secretKey: creds.Credentials.SecretAccessKey,
                    // sessionToken: creds.Credentials.SessionToken,
                    endpoint: config.s3Endpoint,
                };
                const s3Client = new S3Client(s3Params);
                dispatch(setS3Client(s3Client));
                return dispatch(listBuckets());
            })
            .catch(error => {
                const message = `Failed to returns a set of temporary security credentials: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}
