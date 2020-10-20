export function getAppConfig() {
    return fetch('/config.json', { credentials: 'same-origin' })
        .then(response => {
            return response.json();
        })
        .then(config => {
            const { managementEndpoint, oidcAuthority, oidcClientId, stsEndpoint, zenkoEndpoint } = config;
            if (!managementEndpoint || !oidcAuthority || !oidcClientId || !stsEndpoint || !zenkoEndpoint) {
                throw new Error('incorrect or missing mandatory configuration information(s). (i.e. managementEndpoint, oidcAuthority, oidcClientId, stsEndpoint and zenkoEndpoint)');
            }
            return {
                managementEndpoint,
                oidcAuthority,
                oidcClientId,
                stsEndpoint,
                zenkoEndpoint,
            };
        });
}
