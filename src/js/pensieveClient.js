import Swagger from 'swagger-client';

function makePensieveClient(apiEndpoint, instanceId){
    const request = {
        url: `${apiEndpoint}/api/v1/management/${instanceId}/token`,
        method: 'GET',
        headers: { 'X-Management-Authentication-Token': 'coco' },
    };

    return Swagger.http(request)
        .then((res) => {
            return Swagger(apiEndpoint + '/swagger.json',
                { authorizations: { 'public-api': res.body.token } });
        })
        .then(client => {
            client.spec.schemes = [apiEndpoint.split(':')[0]];
            const pensieveClient = client.apis['ui-facing'];
            return pensieveClient;
        })
        .catch(error => {
            throw new Error(
                `Unable to fetch OpenAPI descriptor: ${error.message || '(unknown reason)'}`);
        });
}

export default makePensieveClient;
