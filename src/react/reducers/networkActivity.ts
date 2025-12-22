import { NetworkActivityAction } from '../../types/actions';
import { NetworkActivityState } from '../../types/state';
import { initialNetworkActivityState } from './initialConstants';

export default function networkActivity(
  state: NetworkActivityState = initialNetworkActivityState,
  action: NetworkActivityAction,
) {
  switch (action.type) {
    case 'NETWORK_AUTH_FAILURE':
      return { ...state, authFailure: true };

    case 'NETWORK_AUTH_RESET':
    case 'LOAD_CLIENTS_SUCCESS':
      return { ...state, authFailure: false };

    default:
      return state;
  }
}
