// @flow
import type { ConfigurationAction } from '../../types/actions';
import type { ConfigurationState } from '../../types/state';
import { initialConfiguration } from './initialConstants';

export default function configuration(
  state: ConfigurationState = initialConfiguration,
  action: ConfigurationAction,
) {
  switch (action.type) {
    // case 'INSTANCE_STATUS': {
    //     const configurationOverlay = action.status && action.status.state &&
    //         action.status.state.latestConfigurationOverlay || initialConfiguration.latest;
    //     return {
    //         ...state,
    //         latest: configurationOverlay,
    //     };
    // }
    case 'CONFIGURATION_VERSION':
      return {
        ...state,
        latest: action.configuration,
      };
    default:
      return state;
  }
}
