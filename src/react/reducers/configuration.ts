import { ConfigurationAction } from '../../types/actions';
import { ConfigurationState } from '../../types/state';
import { initialConfiguration } from './initialConstants';
export default function configuration(
  state: ConfigurationState = initialConfiguration,
  action: ConfigurationAction,
) {
  switch (action.type) {
    case 'CONFIGURATION_VERSION':
      return { ...state, latest: action.configuration };

    default:
      return state;
  }
}
