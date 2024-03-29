import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  getConfigOverlay,
  LOCATIONS,
} from '../../../../js/mock/managementClientMSWHandlers';
import { PensieveAccountsLocationsAdapter } from './PensieveAccountsLocationsAdapter';

const baseUrl = 'http://localhost:8080';
const instanceId = 'test-instance-id';
const server = setupServer(getConfigOverlay(baseUrl, instanceId));

describe('PensieveAccountsAdapter - listLocations', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const token = 'test-token';
    const SUT = new PensieveAccountsLocationsAdapter(
      baseUrl,
      instanceId,
      token,
    );
    server.use(
      rest.get(
        `${baseUrl}/api/v1/config/overlay/view/${instanceId}`,
        (req, res, ctx) => res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listLocations()).rejects.toBeDefined();
  });

  it('should return expected locations', async () => {
    //S
    const token = 'test-token';
    const SUT = new PensieveAccountsLocationsAdapter(
      baseUrl,
      instanceId,
      token,
    );

    //E
    const result = await SUT.listLocations();

    //V
    const EXPECTED_LOCATIONS = Object.values(LOCATIONS).map((location) => ({
      //@ts-expect-error fix this when you are working on it
      id: location.objectId || '',
      //@ts-ignore - isCold does not xist on builtin locations
      isCold: location.isCold,
      //@ts-ignore - isTransient does not xist on builtin locations
      isTransient: location.isTransient,
      name: location.name,
      type: location.locationType,
      //@ts-ignore - details does not xist on builtin locations
      details: location.details || {},
    }));
    expect(result).toStrictEqual(EXPECTED_LOCATIONS);
  });
});
