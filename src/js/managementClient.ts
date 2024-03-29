import { genClientEndpoint } from '../react/utils';
import { UiFacingApi } from './managementClient/api';
import { Configuration } from './managementClient/configuration';

function makeMgtClient(endpoint: string, token: string) {
  return new UiFacingApi(
    new Configuration({
      apiKey: token,
      basePath: `${genClientEndpoint(endpoint)}/api/v1`,
    }),
    `${endpoint}/api/v1`,
    window.fetch,
  );
}

export default makeMgtClient;
