import { genClientEndpoint } from '../react/utils';
import { UiFacingApi } from './managementClient/api';
import { Configuration } from './managementClient/configuration';

export class UiFacingApiWrapper extends UiFacingApi {
  constructor(
    configuration: Configuration,
    public baseUrl: string,
    public fetchFn: typeof window.fetch,
  ) {
    super(configuration, baseUrl, fetchFn);
  }

  setToken(token: string) {
    this.configuration = new Configuration({
      apiKey: token,
      basePath: `${genClientEndpoint(this.baseUrl)}/api/v1`,
    });
  }
}

function makeMgtClient(endpoint: string, token: string) {
  return new UiFacingApiWrapper(
    new Configuration({
      apiKey: token,
      basePath: `${genClientEndpoint(endpoint)}/api/v1`,
    }),
    `${endpoint}/api/v1`,
    window.fetch,
  );
}

export default makeMgtClient;
