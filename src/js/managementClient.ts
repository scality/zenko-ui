import { UiFacingApi } from './managementClient/api';
import { Configuration } from './managementClient/configuration';

function makeMgtClient(endpoint: string, token: string) {
  return Promise.resolve(
    new UiFacingApi(
      new Configuration({ apiKey: token, basePath: `${endpoint}/api/v1` }),
    ),
  );
}

export default makeMgtClient;
