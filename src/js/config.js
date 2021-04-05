export function getAppConfig() {
    return fetch('/config.json', { credentials: 'same-origin' })
        .then(response => {
            return response.json();
        })
        .then(config => {
            const { managementEndpoint, navbarConfigUrl, navbarEndpoint, oidcAuthority, oidcClientId, stsEndpoint, zenkoEndpoint } = config;
            if (!navbarEndpoint || !managementEndpoint || !oidcAuthority || !oidcClientId || !stsEndpoint || !zenkoEndpoint) {
                throw new Error('incorrect or missing mandatory configuration information(s). (i.e. managementEndpoint, navbarEndpoint, oidcAuthority, oidcClientId, stsEndpoint and zenkoEndpoint)');
            }
            return {
                managementEndpoint,
                navbarConfigUrl,
                navbarEndpoint,
                oidcAuthority,
                oidcClientId,
                stsEndpoint,
                zenkoEndpoint,
            };
        });
}
