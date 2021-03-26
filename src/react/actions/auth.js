// @flow

import type { AppConfig, InstanceId, Theme } from '../../types/entities';
import type {
    ConfigAuthFailureAction,
    LoadClientsSuccessAction,
    LoadConfigSuccessAction,
    SetAppConfigAction,
    SetManagementClientAction,
    SetSTSClientAction,
    SetThemeAction,
    ThunkNonStateAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { handleErrorMessage, loadInstanceLatestStatus, loadInstanceStats, networkAuthFailure, selectAccountID, setZenkoClient, updateConfiguration } from './index';
import IAMClient from '../../js/IAMClient';
import type { ManagementClient as ManagementClientInterface } from '../../types/managementClient';
import STSClient from '../../js/STSClient';
import type { STSClient as STSClientInterface } from '../../types/sts';
import ZenkoClient from '../../js/ZenkoClient';
import { getAppConfig } from '../../js/config';
import makeMgtClient from '../../js/managementClient';
import { setIAMClient } from './iam';

export function setManagementClient(managementClient: ManagementClientInterface): SetManagementClientAction {
    return {
        type: 'SET_MANAGEMENT_CLIENT',
        managementClient,
    };
}

export function setSTSClient(stsClient: STSClientInterface): SetSTSClientAction {
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

export function setTheme(theme: Theme): SetThemeAction {
    return {
        type: 'SET_THEME',
        theme,
    };
}

export function loadAppConfig(): ThunkNonStateAction {
    return dispatch => {
        return getAppConfig()
            .then(config => {
                dispatch(setAppConfig(config));
                dispatch(setSTSClient(new STSClient({ endpoint: config.stsEndpoint })));
                dispatch(setZenkoClient(new ZenkoClient(config.zenkoEndpoint)));
                dispatch(setIAMClient(new IAMClient()));
                dispatch(loadConfigSuccess());
            })
            .catch(error => {
                const message = `Invalid application configuration: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byComponent'));
                dispatch(configAuthFailure());
            });
    };
}

export function loadClients(): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { oidc, auth: { config } } = getState();

        const instanceIds = oidc.user && oidc.user.profile && oidc.user.profile.instanceIds;
        if (!instanceIds || instanceIds.length === 0) {
            dispatch(handleErrorMessage('missing the "instanceIds" claim in ID token', 'byAuth'));
            dispatch(networkAuthFailure());
            return Promise.resolve();
        }
        // TODO: Give the user the ability to select an instance.
        dispatch(selectInstance(instanceIds[0]));

        return makeMgtClient(config.managementEndpoint, oidc.user.id_token)
            .then(managementClient => {
                dispatch(setManagementClient(managementClient));
                return Promise.all([
                    dispatch(updateConfiguration()),
                    dispatch(loadInstanceLatestStatus()),
                    dispatch(loadInstanceStats()),
                ]);
            })
            .then(() => dispatch(selectAccountID()))
            .then(() => dispatch(loadClientsSuccess()))
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}
