import { UserManager } from 'oidc-client';

export function makeUserManager({ oidcAuthority: authority, oidcClientId: clientId }) {
    const config =  {
        // authority: 'http://localhost:8080/auth/realms/myrealm',
        authority: authority,
        // client_id: 'myclient',
        client_id: clientId,
        redirect_uri: 'http://127.0.0.1:8383/login/callback',
        post_logout_redirect_uri: 'http://127.0.0.1:8383/login',
        response_type: 'code',
        scope: 'openid email roles',
        // filterProtocolClaims: false,
        // loadUserInfo: true,
    };

    return new UserManager(config);
}
