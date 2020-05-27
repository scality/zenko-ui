export function getAppConfig() {
    return fetch('/config.json', { credentials: 'same-origin' })
        .then(response => {
            return response.json();
        })
        .then(config => {
            const { managementEndpoint, oidcAuthority, oidcClientId, stsEndpoint, s3Endpoint } = config;
            if (!managementEndpoint || !oidcAuthority || !oidcClientId || !stsEndpoint || !s3Endpoint) {
                throw new Error('incorrect or missing mandatory configuration information(s). (i.e. managementEndpoint, oidcAuthority, oidcClientId, stsEndpoint and s3Endpoint)');
            }
            return {
                managementEndpoint,
                oidcAuthority,
                oidcClientId,
                stsEndpoint,
                s3Endpoint,
            };
        });
}
