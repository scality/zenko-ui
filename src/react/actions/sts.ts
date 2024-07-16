import { handleErrorMessage, networkAuthFailure } from './index';
import { ThunkStatePromisedAction } from '../../types/actions';
import { getClients } from '../utils/actions';

// TODO: To be removed eventually
export function assumeRoleWithWebIdentity(
  roleArn: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { zenkoClient, stsClient } = getClients(getState());
    const { oidc } = getState();
    const assumeRoleParams = {
      idToken: oidc.user.id_token,
      roleArn: roleArn,
      RoleSessionName: `ui-${oidc.user.profile.sub}`,
    };
    return stsClient
      .assumeRoleWithWebIdentity(assumeRoleParams)
      .then((creds) => {
        const params = {
          accessKey: creds.Credentials.AccessKeyId,
          secretKey: creds.Credentials.SecretAccessKey,
          sessionToken: creds.Credentials.SessionToken,
        };
        zenkoClient.login(params);
      })
      .catch((error) => {
        let message = `Failed to return a valid set of temporary security credentials: ${
          error.message || '(unknown reason)'
        }`;

        if (error.statusCode >= 500 && error.statusCode < 600) {
          message = `A server error occurred: ${
            error.message || '(unknown reason)'
          }`;
        }

        dispatch(handleErrorMessage(message, 'byAuth'));
        dispatch(networkAuthFailure());
      });
  };
}
