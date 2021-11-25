// @flow
import {
  handleErrorMessage,
  listBuckets,
  networkAuthFailure,
  searchWorkflows,
} from './index';
import type { ThunkStatePromisedAction } from '../../types/actions';
import { getClients } from '../utils/actions';

export function assumeRoleWithWebIdentity(
  roleArn: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient, stsClient } = getClients(getState());
    const { oidc } = getState();
    const assumeRoleParams = {
      idToken: oidc.user.id_token,
      roleArn,
      RoleSessionName: oidc.user.profile.sub,
    };
    return stsClient
      .assumeRoleWithWebIdentity(assumeRoleParams)
      .then(creds => {
        const params = {
          accessKey: creds.Credentials.AccessKeyId,
          secretKey: creds.Credentials.SecretAccessKey,
          sessionToken: creds.Credentials.SessionToken,
        };
        zenkoClient.login(params);
        return Promise.all([
          dispatch(searchWorkflows()),
          dispatch(listBuckets()),
        ]);
      })
      .catch(error => {
        let message = `Failed to return a valid set of temporary security credentials: ${error.message ||
          '(unknown reason)'}`;
        if (error.statusCode >= 500 && error.statusCode < 600) {
          message = `A server error occurred: ${error.message ||
            '(unknown reason)'}`;
        }
        dispatch(handleErrorMessage(message, 'byAuth'));
        dispatch(networkAuthFailure());
      });
  };
}
