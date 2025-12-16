import STSClient from '../../js/STSClient';
import makeMgtClient from '../../js/managementClient';
import {
  ConfigAuthFailureAction,
  LoadClientsSuccessAction,
  LoadConfigSuccessAction,
  SetAppConfigAction,
  SetManagementClientAction,
  SetOIDCLogoutAction,
  SetSTSClientAction,
  ThunkNonStateAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import { AuthUser, OidcLogoutFunction } from '../../types/auth';
import { AppConfig, InstanceId } from '../../types/entities';
import { ManagementClient as ManagementClientInterface } from '../../types/managementClient';
import { STSClient as STSClientInterface } from '../../types/sts';
import {
  handleErrorMessage,
  loadInstanceLatestStatus,
  networkAuthFailure,
} from './index';
export function setOIDCLogout(logout: OidcLogoutFunction): SetOIDCLogoutAction {
  return {
    type: 'SET_OIDC_LOGOUT',
    logout,
  };
}
export function setManagementClient(
  managementClient: ManagementClientInterface,
): SetManagementClientAction {
  return {
    type: 'SET_MANAGEMENT_CLIENT',
    managementClient,
  };
}
export function setSTSClient(
  stsClient: STSClientInterface,
): SetSTSClientAction {
  return {
    type: 'SET_STS_CLIENT',
    stsClient,
  };
}
export function setAppConfig(config: AppConfig): SetAppConfigAction {
  return {
    type: 'SET_APP_CONFIG',
    config,
  };
}
export function selectInstance(selectedId: InstanceId) {
  return {
    type: 'SELECT_INSTANCE',
    selectedId,
  };
}
export function loadConfigSuccess(): LoadConfigSuccessAction {
  return {
    type: 'LOAD_CONFIG_SUCCESS',
  };
}
export function loadClientsSuccess(): LoadClientsSuccessAction {
  return {
    type: 'LOAD_CLIENTS_SUCCESS',
  };
}
export function configAuthFailure(): ConfigAuthFailureAction {
  return {
    type: 'CONFIG_AUTH_FAILURE',
  };
}
export function loadAppConfig(config: AppConfig, user): ThunkNonStateAction {
  return (dispatch) => {
    dispatch(setAppConfig(config));
    dispatch(
      setSTSClient(
        //@ts-expect-error fix this when you are working on it
        new STSClient({
          endpoint: config.stsEndpoint,
        }),
      ),
    );
    dispatch(loadConfigSuccess());
    dispatch(loadClients(user?.original));
    return Promise.resolve();
  };
}
export function loadClients(user?: AuthUser): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const {
      auth: { config },
    } = getState();
    const instanceIds = user && user.profile && user.profile.instanceIds;

    if (!instanceIds || instanceIds.length === 0) {
      dispatch(
        handleErrorMessage(
          'missing the "instanceIds" claim in ID token',
          'byAuth',
        ),
      );
      dispatch(networkAuthFailure());
      return Promise.resolve();
    }

    // TODO: Give the user the ability to select an instance.
    // @ts-expect-error should be remove when we remove redux
    dispatch(selectInstance(instanceIds[0]));
    const managementClient = makeMgtClient(
      config.managementEndpoint,
      user.id_token,
    );

    dispatch(setManagementClient(managementClient));
    return dispatch(loadInstanceLatestStatus())
      .then(() => dispatch(loadClientsSuccess()))
      .catch((error) => {
        if (error.message) {
          dispatch(handleErrorMessage(error.message, 'byAuth'));
        }

        dispatch(networkAuthFailure());
      });
  };
}
