function getAuthCodeFromLocation(location: string): string | undefined {
    const url = new URL(location);
    const params = url.search.substring(1).split('&');
    for (const param of params) {
        const [key, value] = param.split('=');
        if (key === 'code') {
            return value;
        }
    }
}

Cypress.Commands.add('kcLogin', (userProfile, username, password) => {
    Cypress.log({ name: 'Login' });
    const userName =  username || Cypress.env('USERNAME');
    const passWord = password || Cypress.env('PASSWORD');
    const profile = userProfile || {};

    const keycloakRoot = Cypress.env('KEYCLOAK_ROOT') || 'http://127.0.0.1:8080';
    const keycloakRealm = Cypress.env('KEYCLOAK_REALM') || 'myrealm';
    const keycloakClientID = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myclient';

    const getStartBody = {
        url: keycloakRoot + '/auth/realms/' + keycloakRealm + '/protocol/openid-connect/auth',
        followRedirect: false,
        qs: {
            scope: 'openid',
            response_type: 'code',
            approval_prompt: 'auto',
            redirect_uri: Cypress.config('baseUrl') + '/login/callback',
            client_id: keycloakClientID,
        },
    };
    // Step 1
    return cy.request(getStartBody).then(response => {
        const html = document.createElement('html');
        html.innerHTML = response.body;

        const form = html.getElementsByTagName('form')[0];
        const url = form.action;
        console.log('url!!!', url);
        const postLoginBody = {
            method: 'POST',
            url,
            followRedirect: false,
            form: true,
            body: {
                username: userName,
                password: passWord,
            },
        };
        // Step 2
        return cy.request(postLoginBody);
        // Keycloak cookies now set

    }).then(response => {
        const code = getAuthCodeFromLocation(response.headers['location']);
        console.log('code!!!', code);
        return cy.request({
            method: 'POST',
            url: `${keycloakRoot}/auth/realms/${keycloakRealm}/protocol/openid-connect/token`,
            body: {
                client_id: keycloakClientID,
                redirect_uri: Cypress.config('baseUrl') + '/login/callback',
                code,
                grant_type: 'authorization_code',
            },
            form: true,
            followRedirect: false,
        });
    }).then(response => {
        const { access_token, expires_in, id_token, refresh_token, session_state, token_type, scope} = response.body;
        console.log('tokens!!!', response.body);
        const t = {
            access_token,
            expires_at: expires_in * 1000 + new Date().getTime(),
            id_token,
            profile,
            refresh_token,
            scope,
            session_state,
            token_type,
        };
        console.log('t!!!', t);
        window.sessionStorage.setItem(`oidc.user:${keycloakRoot}/auth/realms/${keycloakRealm}:${keycloakClientID}`, JSON.stringify(t));
        console.log('FINISHHHH!!!');
    });
});

Cypress.Commands.add('kcLogout', () => {
    Cypress.log({ name: 'Logout' });
    const keycloakRoot = Cypress.env('KEYCLOAK_ROOT') || 'http://127.0.0.1:8080';
    const keycloakRealm = Cypress.env('KEYCLOAK_REALM') || 'myrealm';
    return cy.request({
        url: `${keycloakRoot}/auth/realms/${keycloakRealm}/protocol/openid-connect/logout`,
    });
});

Cypress.Commands.add('kcFakeLogin', (userProfile) => {
    Cypress.log({ name: 'Login' });
    const keycloakRoot = Cypress.env('KEYCLOAK_ROOT') || 'http://127.0.0.1:8080';
    const keycloakRealm = Cypress.env('KEYCLOAK_REALM') || 'myrealm';
    const keycloakClientID = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myclient';
    const t = {
        access_token: '123',
        expires_at: 999999999 * 1000 + new Date().getTime(),
        id_token: '123',
        profile: userProfile || {},
        refresh_token: '123',
        scope: 'openid profile email',
        session_state: '123',
        token_type: 'bearer',
    };
    window.sessionStorage.setItem(`oidc.user:${keycloakRoot}/auth/realms/${keycloakRealm}:${keycloakClientID}`, JSON.stringify(t));
});

Cypress.Commands.add('clearSession', () => {
    Cypress.log({ name: 'Logout' });
    cy.window().then(window => window.sessionStorage.clear());
});
