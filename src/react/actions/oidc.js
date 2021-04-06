// @flow

import type { AuthUser } from '../../types/auth';
import type { OIDCAction } from '../../types/actions';

export function addOIDCUser(user: AuthUser): OIDCAction {
    return {
        type: 'ADD_OIDC_USER',
        user,
    };
}
