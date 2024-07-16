import STSClient from '../../js/STSClient';
import ZenkoClient from '../../js/ZenkoClient';
import makeMgtClient from '../../js/managementClient';
import type {
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
import type { OidcLogoutFunction } from '../../types/auth';
import type { AppConfig, InstanceId } from '../../types/entities';
import type { ManagementClient as ManagementClientInterface } from '../../types/managementClient';
import type { STSClient as STSClientInterface } from '../../types/sts';
import {
  addOIDCUser,
  handleErrorMessage,
  loadInstanceLatestStatus,
  networkAuthFailure,
  setZenkoClient,
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
    dispatch(addOIDCUser(user.original));
    dispatch(setAppConfig(config));
    dispatch(
      setSTSClient(
        //@ts-expect-error fix this when you are working on it
        new STSClient({
          endpoint: config.stsEndpoint,
        }),
      ),
    );
    dispatch(
      setZenkoClient(
        new ZenkoClient(
          config.zenkoEndpoint,
          config.iamInternalFQDN,
          config.s3InternalFQDN,
          config.basePath,
        ),
      ),
    );
    dispatch(loadConfigSuccess());
    dispatch(loadClients());
    return Promise.resolve();
  };
}
export function loadClients(): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const {
      oidc,
      auth: { config },
    } = getState();
    const instanceIds =
      oidc.user && oidc.user.profile && oidc.user.profile.instanceIds;

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
    dispatch(selectInstance(instanceIds[0]));
    const managementClient = makeMgtClient(
      config.managementEndpoint,
      oidc.user.id_token,
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
