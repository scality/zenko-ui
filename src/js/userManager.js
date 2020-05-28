import { createUserManager } from 'redux-oidc';

export function makeUserManager({ oidcAuthority: authority, oidcClientId: clientId }) {
    const config =  {
        // authority: 'http://localhost:8080/auth/realms/myrealm',
        authority: authority,
        // client_id: 'myclient',
        client_id: clientId,
        redirect_uri: 'http://127.0.0.1:8383/login/callback',
        post_logout_redirect_uri: 'http://127.0.0.1:8383/logout/callback',
        response_type: 'id_token token',
        scope: 'openid email',

        automaticSilentRenew: true,
        // silent_redirect_uri: 'http://127.0.0.1:8383/silent/refresh',
        // accessTokenExpiringNotificationTime: 10,
        // filterProtocolClaims: false,
        // loadUserInfo: true,
    };

    return createUserManager(config);
}
