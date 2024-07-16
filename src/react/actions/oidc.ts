import { AuthUser } from '../../types/auth';
import { OIDCAction } from '../../types/actions';
export function addOIDCUser(user: AuthUser): OIDCAction {
  return {
    type: 'ADD_OIDC_USER',
    user,
  };
}
