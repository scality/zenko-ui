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

  setToken(token: string | null) {
    const basePath = `${genClientEndpoint(this.baseUrl)}/api/v1`;
    const auth =
      typeof token === 'string' && token
        ? token
        : (this.configuration?.apiKey as string | undefined);
    this.configuration = new Configuration({
      apiKey: auth,
      basePath,
    });
  }
}

function makeMgtClient(endpoint: string, token: string) {
  const basePath = `${genClientEndpoint(endpoint)}/api/v1`;
  return new UiFacingApiWrapper(
    new Configuration({
      apiKey: token,
      basePath,
    }),
    `${endpoint}/api/v1`,
    window.fetch,
  );
}

export default makeMgtClient;
