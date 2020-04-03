import Swagger from 'swagger-client';

function makeApiClient(apiEndpoint, instanceId){
    // NOTE: This is not production-ready.
    // It implements an authentication call based on a hardcoded OIDC token and an instance ID set in the `config.json` file.
    // This call returns a JWT token which allows the user to access "pensieve-api" resources that are permitted with that token.
    const request = {
        url: `${apiEndpoint}/api/v1/management/${instanceId}/token`,
        method: 'GET',
        headers: { 'X-Management-Authentication-Token': 'oidc.token' },
    };

    // TODO: use refreshToken API
    return Swagger.http(request)
        .then((res) => {
            return Swagger(apiEndpoint + '/swagger.json',
                { authorizations: { 'public-api': res.body.token } });
        })
        .then(client => {
            client.spec.schemes = [apiEndpoint.split(':')[0]];
            const apiClient = client.apis['ui-facing'];
            return apiClient;
        })
        .catch(error => {
            throw new Error(
                `Unable to fetch OpenAPI descriptor: ${error.message || '(unknown reason)'}`);
        });
}

export default makeApiClient;
