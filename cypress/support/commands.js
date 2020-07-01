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

Cypress.Commands.add('kcLogin', (username, password) => {
    Cypress.log({ name: 'Login' });
    const kcUsername =  username || Cypress.env('KEYCLOAK_USERNAME');
    const kcPassword = password || Cypress.env('KEYCLOAK_PASSWORD');

    if (!kcUsername || !kcPassword) {
        throw new Error('missing CYPRESS_KEYCLOAK_USERNAME and/or CYPRESS_KEYCLOAK_PASSWORD environment variable');
    }

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
    return cy.request(getStartBody).then(response => {
        const html = document.createElement('html');
        html.innerHTML = response.body;

        const form = html.getElementsByTagName('form')[0];
        const url = form.action;
        const postLoginBody = {
            method: 'POST',
            url,
            followRedirect: false,
            form: true,
            body: {
                username: kcUsername,
                password: kcPassword,
            },
        };
        return cy.request(postLoginBody);
    });
});

Cypress.Commands.add('kcLogout', () => {
    Cypress.log({ name: 'Logout' });
    const keycloakRoot = Cypress.env('KEYCLOAK_ROOT') || 'http://127.0.0.1:8080';
    const keycloakRealm = Cypress.env('KEYCLOAK_REALM') || 'myrealm';
    cy.clearSession();
    return cy.request({
        url: `${keycloakRoot}/auth/realms/${keycloakRealm}/protocol/openid-connect/logout`,
    });
});

Cypress.Commands.add('kcFakeLogin', (userProfile) => {
    Cypress.log({ name: 'Fake Login' });
    const keycloakRoot = Cypress.env('KEYCLOAK_ROOT') || 'http://127.0.0.1:8080';
    const keycloakRealm = Cypress.env('KEYCLOAK_REALM') || 'myrealm';
    const keycloakClientID = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myclient';
    const t = {
        access_token: 'fake_access_token',
        expires_at: 15 * 60 * 1000 + new Date().getTime(),
        id_token: 'fake_id_token',
        profile: userProfile || {},
        refresh_token: 'fake_refresh_token',
        scope: 'openid profile email',
        session_state: 'fake_session_state',
        token_type: 'bearer',
    };
    window.sessionStorage.setItem(`oidc.user:${keycloakRoot}/auth/realms/${keycloakRealm}:${keycloakClientID}`, JSON.stringify(t));
});

Cypress.Commands.add('clearSession', () => {
    Cypress.log({ name: 'Clear Session' });
    cy.window().then(window => window.sessionStorage.clear());
});
