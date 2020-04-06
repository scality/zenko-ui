import Swagger from 'swagger-client';

function makeApiClient(apiEndpoint, instanceId){
    const request = {
        url: `${apiEndpoint}/api/v1/management/${instanceId}/token`,
        method: 'GET',
        headers: { 'X-Management-Authentication-Token': 'coco' },
    };

    return Swagger(apiEndpoint + '/swagger.json')
        .then(client => {
            // TODO: use refreshToken API
            client.requestInterceptor = (r) => {
                return Swagger.http(request).then((res) => {
                    r.headers['X-Authentication-Token'] = res.body.token;
                    return r;
                });
            };
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
