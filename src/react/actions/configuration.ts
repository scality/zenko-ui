import type {
  ConfigurationVersionAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import type { ConfigurationOverlay } from '../../types/config';
import { getClients } from '../utils/actions';
import { loadInstanceLatestStatus } from './stats';
import { until } from 'async';
export function newConfiguration(
  configuration: ConfigurationOverlay,
): ConfigurationVersionAction {
  return {
    type: 'CONFIGURATION_VERSION',
    configuration,
  };
}
export function updateConfiguration(): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { managementClient, instanceId } = getClients(getState());
    return managementClient
      .getConfigurationOverlayView(instanceId)
      .then((res) => {
        const configuration = {
          ...res,
          users: [
            ...(res.users || []).map((user) => ({ ...user, Name: user.userName })),
          ],
        };
        dispatch(newConfiguration(configuration));
      })
      .catch((error) => {
        throw error;
      }); //! errors will be handled by caller
  };
}
export function waitForRunningConfigurationVersionUpdate(): ThunkStatePromisedAction {
  return (dispatch, getState) =>
    until(
      (cb) => {
        const { configuration, instanceStatus } = getState();
        const runningVersion =
          instanceStatus.latest.state.runningConfigurationVersion;
        setTimeout(
          cb,
          500,
          null,
          runningVersion >= configuration.latest.version,
        );
      },
      (next) => dispatch(loadInstanceLatestStatus()).then(next),
    );
}
