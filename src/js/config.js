export function getAppConfig() {
    return fetch('/config.json', { credentials: 'same-origin' })
        .then(response => {
            return response.json();
        })
        .then(config => {
            const { managementEndpoint, navbarConfigUrl, navbarEndpoint, stsEndpoint, zenkoEndpoint, iamEndpoint } = config;
            if (!navbarEndpoint || !managementEndpoint || !stsEndpoint || !zenkoEndpoint || !iamEndpoint) {
                throw new Error('incorrect or missing mandatory configuration information(s). (i.e. managementEndpoint, navbarEndpoint, stsEndpoint, iamEndpoint and zenkoEndpoint)');
            }
            return {
                managementEndpoint,
                navbarConfigUrl,
                navbarEndpoint,
                stsEndpoint,
                zenkoEndpoint,
                iamEndpoint,
            };
        });
}
