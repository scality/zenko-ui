import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  LOCATIONS_METRICS_RESPONSE,
  LOCATION_ID,
  NEWLY_CREATED_LOCATION_ID,
  getStorageConsumptionMetricsHandlers,
} from '../../../../js/mock/managementClientMSWHandlers';
import { PensieveMetricsAdapter } from './PensieveMetricsAdapter';

LOCATION_ID;
NEWLY_CREATED_LOCATION_ID;
const baseUrl = 'http://localhost:8080';
const instanceId = 'test-instance-id';
const server = setupServer(
  ...getStorageConsumptionMetricsHandlers(baseUrl, instanceId),
);

describe('PensieveMetricsAdapter - listLocationsLatestUsedCapacity', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const token = 'test-token';
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, token);
    server.use(
      rest.post(
        `${baseUrl}/api/v1/instance/${instanceId}/location/metrics`,
        (req, res, ctx) => res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listLocationsLatestUsedCapacity([])).rejects.toBeDefined();
  });

  it('should return expected location metrics', async () => {
    //S
    const token = 'test-token';
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, token);

    //E
    const result = await SUT.listLocationsLatestUsedCapacity([
      LOCATION_ID,
      NEWLY_CREATED_LOCATION_ID,
    ]);

    // V
    const EXPECTED_LOCATIONS = LOCATIONS_METRICS_RESPONSE;
    expect(result).toStrictEqual(EXPECTED_LOCATIONS);
  });
});
