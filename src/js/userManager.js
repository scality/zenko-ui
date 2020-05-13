import { UserManager } from 'oidc-client';

const config =  {
    authority: 'http://localhost:8080/auth/realms/myrealm',
    client_id: 'myclient',
    redirect_uri: 'http://127.0.0.1:8383/login/callback',
    // post_logout_redirect_uri: 'http://localhost:3000/logout/response',
    response_type: 'code',
    scope: 'openid email roles',
    // filterProtocolClaims: false,
    // loadUserInfo: true,
};

const userManager = new UserManager(config);

export default userManager;
