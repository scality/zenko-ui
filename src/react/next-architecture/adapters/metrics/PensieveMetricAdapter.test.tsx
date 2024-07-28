import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  ACCOUNT_CANONICAL_ID,
  ACCOUNT_METRICS,
  BUCKET_CREATION_DATE,
  BUCKET_METRICS_RESPONSE,
  BUCKET_NAME,
  LOCATIONS_METRICS_RESPONSE,
  LOCATION_ID,
  MEASURED_ON,
  NEWLY_CREATED_ACCOUNT_CANONICAL_ID,
  NEWLY_CREATED_ACCOUNT_METRICS,
  NEWLY_CREATED_BUCKET_CREATION_DATE,
  NEWLY_CREATED_BUCKET_NAME,
  NEWLY_CREATED_LOCATION_ID,
  USED_CAPACITY_CURRENT,
  USED_CAPACITY_NON_CURRENT,
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

const mockGettoken = () => Promise.resolve('test-token');

describe('PensieveMetricsAdapter - listLocationsLatestUsedCapacity', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);
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
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);

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

describe('PensieveMetricsAdapter - listBucketsLatestUsedCapacity', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);
    server.use(
      rest.post(
        `${baseUrl}/api/v1/instance/${instanceId}/bucket/metrics`,
        (req, res, ctx) => res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listBucketsLatestUsedCapacity([])).rejects.toBeDefined();
  });

  it('should return expected buckets metrics', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);

    //E
    const result = await SUT.listBucketsLatestUsedCapacity([
      { Name: BUCKET_NAME, CreationDate: new Date(BUCKET_CREATION_DATE) },
      {
        Name: NEWLY_CREATED_BUCKET_NAME,
        CreationDate: new Date(NEWLY_CREATED_BUCKET_CREATION_DATE),
      },
    ]);

    // V
    const EXPECTED_BUCKETS_METRICS = BUCKET_METRICS_RESPONSE;
    expect(result).toStrictEqual(EXPECTED_BUCKETS_METRICS);
  });
});

describe('PensieveMetricsAdapter - listAccountsLatestUsedCapacity', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);
    server.use(
      rest.post(
        `${baseUrl}/api/v1/instance/${instanceId}/account/metrics`,
        (req, res, ctx) => res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(SUT.listAccountsLatestUsedCapacity([])).rejects.toBeDefined();
  });

  it('should return expected buckets metrics', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);

    //E
    const result = await SUT.listAccountsLatestUsedCapacity([
      ACCOUNT_CANONICAL_ID,
      NEWLY_CREATED_ACCOUNT_CANONICAL_ID,
    ]);

    // V
    const EXPECTED_ACCOUNTS_METRICS = {
      [ACCOUNT_CANONICAL_ID]: ACCOUNT_METRICS,
      [NEWLY_CREATED_ACCOUNT_CANONICAL_ID]: NEWLY_CREATED_ACCOUNT_METRICS,
    };
    expect(result).toStrictEqual(EXPECTED_ACCOUNTS_METRICS);
  });
});

describe('PensieveMetricsAdapter - listAccountLocationsLatestUsedCapacity', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);
    server.use(
      rest.get(
        `${baseUrl}/api/v1/instance/${instanceId}/account/${ACCOUNT_CANONICAL_ID}/metrics`,
        (req, res, ctx) => res(ctx.status(500)),
      ),
    );

    //E+V
    await expect(
      SUT.listAccountLocationsLatestUsedCapacity(ACCOUNT_CANONICAL_ID),
    ).rejects.toBeDefined();
  });

  it('should return expected buckets metrics', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);

    //E
    const result = await SUT.listAccountLocationsLatestUsedCapacity(
      ACCOUNT_CANONICAL_ID,
    );

    // V
    const EXPECTED_LOCATIONS_METRICS = {
      [LOCATION_ID]: {
        measuredOn: new Date(MEASURED_ON),
        type: 'hasMetrics',
        usedCapacity: {
          current: USED_CAPACITY_CURRENT,
          nonCurrent: USED_CAPACITY_NON_CURRENT,
        },
      },
    };
    expect(result).toStrictEqual(EXPECTED_LOCATIONS_METRICS);
  });
});
