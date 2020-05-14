import { UserManager } from 'oidc-client';

export function makeUserManager({ authority, clientId }) {
    const config =  {
        // authority: 'http://localhost:8080/auth/realms/myrealm',
        authority: authority,
        // client_id: 'myclient',
        client_id: clientId,
        redirect_uri: 'http://127.0.0.1:8383/login/callback',
        // post_logout_redirect_uri: 'http://localhost:3000/logout/response',
        response_type: 'code',
        scope: 'openid email roles',
        // filterProtocolClaims: false,
        // loadUserInfo: true,
    };

    console.log('config!!!', config);

    return new UserManager(config);
}

const config = {
    authority: 'http://localhost:8080/auth/realms/myrealm',
    client_id: 'myclient',
    redirect_uri: 'http://127.0.0.1:8383/login/callback',
    // post_logout_redirect_uri: 'http://localhost:3000/logout/response',
    response_type: 'code',
    scope: 'openid email roles',
    // filterProtocolClaims: false,
    // loadUserInfo: true,
};

export const userManager = new UserManager(config);
