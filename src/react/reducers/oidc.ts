import type { OIDCAction } from '../../types/actions';
import type { OIDCState } from '../../types/state';
import { initialNetworkActivityState } from './initialConstants';
export default function oidc(
  //@ts-expect-error fix this when you are working on it
  state: OIDCState = initialNetworkActivityState,
  action: OIDCAction,
) {
  switch (action.type) {
    case 'ADD_OIDC_USER':
      return { ...state, user: action.user };

    default:
      return state;
  }
}
