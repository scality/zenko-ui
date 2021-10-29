import Swagger from 'swagger-client';

function makeMgtClient(endpoint, token) {
  return Swagger(endpoint + '/swagger.json', {
    authorizations: { 'public-api': token },
  })
    .then(client => {
      client.spec.schemes = [endpoint.split(':')[0]];
      const managementClient = client.apis['ui-facing'];
      return managementClient;
    })
    .catch(error => {
      throw new Error(
        `Unable to fetch OpenAPI descriptor: ${error.message ||
          '(unknown reason)'}`,
      );
    });
}

export default makeMgtClient;
