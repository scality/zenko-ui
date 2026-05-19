import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { getConfigOverlay, LOCATIONS } from '../../../../js/mock/managementClientMSWHandlers';
import { VaultAccountsLocationsAdapter } from './VaultAccountsLocationsAdapter';

const iamEndpoint = 'http://localhost:8600';
const managementBaseUrl = 'http://localhost:8080';
const instanceId = 'test-instance-id';
const mockGetToken = () => Promise.resolve('test-token');

const server = setupServer(getConfigOverlay(managementBaseUrl, instanceId));

describe('VaultAccountsLocationsAdapter - listLocations', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);
    server.use(
      rest.get(`${managementBaseUrl}/api/v1/config/overlay/view/${instanceId}`, (req, res, ctx) =>
        res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listLocations()).rejects.toBeDefined();
  });

  it('should return expected locations from pensieve', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E
    const result = await SUT.listLocations();

    //V
    const EXPECTED_LOCATIONS = Object.values(LOCATIONS).map((location) => ({
      //@ts-expect-error fix this when you are working on it
      id: location.objectId || '',
      //@ts-expect-error - isCold does not exist on builtin locations
      isCold: location.isCold,
      //@ts-expect-error - isTransient does not exist on builtin locations
      isTransient: location.isTransient,
      name: location.name,
      type: location.locationType,
      details: location.details || {},
    }));
    expect(result).toStrictEqual(EXPECTED_LOCATIONS);
  });
});

describe('VaultAccountsLocationsAdapter - listAccountsLocationsAndEndpoints', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should return locations and endpoints from pensieve overlay', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);

    //E
    const result = await SUT.listAccountsLocationsAndEndpoints();

    //V
    expect(result).toHaveProperty('locations');
    expect(result).toHaveProperty('endpoints');
    expect(result).not.toHaveProperty('accounts');
    expect(Array.isArray(result.locations)).toBe(true);
    expect(Array.isArray(result.endpoints)).toBe(true);
  });

  it('should reject when pensieve api returns an error', async () => {
    //S
    const SUT = new VaultAccountsLocationsAdapter(iamEndpoint, mockGetToken, managementBaseUrl, instanceId);
    server.use(
      rest.get(`${managementBaseUrl}/api/v1/config/overlay/view/${instanceId}`, (req, res, ctx) =>
        res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listAccountsLocationsAndEndpoints()).rejects.toBeDefined();
  });
});
