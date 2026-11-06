import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  BUCKET_CREATION_DATE,
  BUCKET_METRICS_RESPONSE,
  BUCKET_NAME,
  getStorageConsumptionMetricsHandlers,
  NEWLY_CREATED_BUCKET_CREATION_DATE,
  NEWLY_CREATED_BUCKET_NAME,
} from '../../../../js/mock/managementClientMSWHandlers';
import { PensieveMetricsAdapter } from './PensieveMetricsAdapter';

const baseUrl = 'http://localhost:8080';
const instanceId = 'test-instance-id';
const server = setupServer(...getStorageConsumptionMetricsHandlers(baseUrl, instanceId));

const mockGettoken = () => Promise.resolve('test-token');

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
      rest.post(`${baseUrl}/api/v1/instance/${instanceId}/bucket/metrics`, (req, res, ctx) => res(ctx.status(500))),
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

describe('PensieveMetricsAdapter - getStorageUsageReport', () => {
  const REPORTING_USAGE_URL = `${baseUrl}/api/v1/instance/${instanceId}/reporting/usage`;

  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should rejects when pensieve api returns an error', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);
    server.use(rest.get(REPORTING_USAGE_URL, (_req, res, ctx) => res(ctx.status(403))));

    //E+V
    await expect(SUT.getStorageUsageReport()).rejects.toBeDefined();
  });

  it('should return the bytes used per account and location across all pages', async () => {
    //S
    const SUT = new PensieveMetricsAdapter(baseUrl, instanceId, mockGettoken);
    server.use(
      rest.get(REPORTING_USAGE_URL, (req, res, ctx) => {
        if (req.url.searchParams.get('marker') === 'page-2') {
          return res(
            ctx.json({
              accounts: { 'account-b': { 'us-east-1': {} }, 'account-c': {} },
              isTruncated: false,
              marker: null,
            }),
          );
        }
        return res(
          ctx.json({
            accounts: { 'account-a': { 'us-east-1': { bytesTotal: 100, objectsTotal: 1 } } },
            isTruncated: true,
            marker: 'page-2',
          }),
        );
      }),
    );

    //E
    const result = await SUT.getStorageUsageReport();

    //V
    expect(result.accounts).toStrictEqual({
      'account-a': { 'us-east-1': 100 },
      'account-b': { 'us-east-1': 0 },
      'account-c': {},
    });
    expect(result.retrievedOn).toBeInstanceOf(Date);
  });
});
