import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { getConfigOverlay, LOCATIONS } from '../../../../js/mock/managementClientMSWHandlers';
import { PensieveAccountsLocationsAdapter } from './PensieveAccountsLocationsAdapter';

const baseUrl = 'http://localhost:8080';
const instanceId = 'test-instance-id';
const server = setupServer(getConfigOverlay(baseUrl, instanceId));
const mockGettoken = () => Promise.resolve('test-token');

describe('PensieveAccountsAdapter - listLocationsAndEndpoints', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should return locations and endpoints from pensieve overlay', async () => {
    //S
    const SUT = new PensieveAccountsLocationsAdapter(baseUrl, instanceId, mockGettoken);

    //E
    const result = await SUT.listLocationsAndEndpoints();

    //V
    expect(result).toHaveProperty('locations');
    expect(result).toHaveProperty('endpoints');
    expect(result).not.toHaveProperty('accounts');
    expect(Array.isArray(result.locations)).toBe(true);
    expect(Array.isArray(result.endpoints)).toBe(true);
  });

  it('should reject when pensieve api returns an error', async () => {
    //S
    const SUT = new PensieveAccountsLocationsAdapter(baseUrl, instanceId, mockGettoken);
    server.use(
      rest.get(`${baseUrl}/api/v1/config/overlay/view/${instanceId}`, (req, res, ctx) => res(ctx.status(500))),
    );

    //E+V
    await expect(SUT.listLocationsAndEndpoints()).rejects.toBeDefined();
  });
});

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
    const SUT = new PensieveAccountsLocationsAdapter(baseUrl, instanceId, mockGettoken);
    server.use(
      rest.get(`${baseUrl}/api/v1/config/overlay/view/${instanceId}`, (req, res, ctx) => res(ctx.status(500))),
    );

    //E+V
    await expect(SUT.listLocations()).rejects.toBeDefined();
  });

  it('should return expected locations', async () => {
    //S
    const token = 'test-token';
    const SUT = new PensieveAccountsLocationsAdapter(baseUrl, instanceId, mockGettoken);

    //E
    const result = await SUT.listLocations();

    //V
    const EXPECTED_LOCATIONS = Object.values(LOCATIONS).map((location) => ({
      //@ts-expect-error fix this when you are working on it
      id: location.objectId || '',
      //@ts-expect-error - isCold does not xist on builtin locations
      isCold: location.isCold,
      //@ts-expect-error - isTransient does not xist on builtin locations
      isTransient: location.isTransient,
      name: location.name,
      type: location.locationType,
      details: location.details || {},
    }));
    expect(result).toStrictEqual(EXPECTED_LOCATIONS);
  });
});
