import {
  DEFAULT_LOCATION,
  useBucketLocationConstraint,
  useListBucketsForCurrentAccount,
} from './buckets';
import { IMetricsAdapter } from '../adapters/metrics/IMetricsAdapter';
import {
  renderHook,
  RenderResult,
  WaitFor,
} from '@testing-library/react-hooks';
import { MockedMetricsAdapter } from '../../adapters/metrics/MockedMetricsAdapter';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from 'react-query';
import { PropsWithChildren } from 'react';
import { ConfigProvider } from '../../ui/ConfigProvider';
import { S3AssumeRoleClientProvider } from '../../ui/S3ClientProvider';
import DataServiceRoleProvider from '../../../DataServiceRoleProvider';
import { MemoryRouter } from 'react-router';
import {
  PromiseResult,
  PromiseStatus,
  PromiseSucceedResult,
} from '../entities/promise';
import { Bucket, BucketsPromiseResult } from '../entities/bucket';
import { LatestUsedCapacity } from '../entities/metrics';

const queryClient = new QueryClient();
const Wrapper = ({ children }: PropsWithChildren<Record<string, never>>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ConfigProvider>
          <DataServiceRoleProvider>
            <S3AssumeRoleClientProvider>{children}</S3AssumeRoleClientProvider>
          </DataServiceRoleProvider>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const config = {
  zenkoEndpoint: 'http://localhost:8000',
  stsEndpoint: 'http://localhost:9000',
};
const frozenDate = new Date('2021-01-01T00:00:00.000Z');

const defaultMockedBuckets = [
  {
    Name: 'bucket1',
    CreationDate: frozenDate,
  },
  {
    Name: 'bucket2',
    CreationDate: frozenDate,
  },
];

const tenThousandsBuckets = Array.from({ length: 10_000 }, (_, i) => ({
  Name: `bucket${i}`,
  CreationDate: frozenDate,
}));

//WORK IN PROGRESS HENCE THE SKIP
describe.skip('Buckets domain', () => {
  function mockConfig() {
    return rest.get(`/config.json`, (req, res, ctx) => {
      return res(ctx.json(config));
    });
  }
  function mockBucketListing(
    bucketList: { Name: string; CreationDate: Date }[] = defaultMockedBuckets,
    forceFailure = false,
  ) {
    return rest.get(`${config.zenkoEndpoint}`, (req, res, ctx) => {
      if (forceFailure) {
        return res(ctx.status(500));
      }

      return res(
        ctx.xml(`
        <?xml version="1.0" encoding="UTF-8"?>
        <ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          <Owner>
            <ID>1234</ID>
            <DisplayName>test</DisplayName>
          </Owner>
          <Buckets>
            ${bucketList
              .map(
                (bucket) => `
              <Bucket>
                <Name>${bucket.Name}</Name>
                <CreationDate>${bucket.CreationDate.toISOString()}</CreationDate>
              </Bucket>
            `,
              )
              .join('')}
          </Buckets>
        </ListAllMyBucketsResult>
      `),
      );
    });
  }
  function mockBucketLocationConstraint(
    location?: string,
    forceFailure = false,
  ) {
    return rest.get(
      `${config.zenkoEndpoint}/:bucketName?location`,
      (req, res, ctx) => {
        if (forceFailure) {
          return res(ctx.status(500));
        }

        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            ${location}
          </LocationConstraint>
        `),
        );
      },
    );
  }

  const server = setupServer(
    mockConfig(),
    mockBucketListing(),
    mockBucketLocationConstraint(),
  );

  beforeEach(() => {
    queryClient.clear();
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const setupAndRenderListBucketsHook = (
    metricsAdapterInterceptor?: (
      metricsAdapter: IMetricsAdapter,
    ) => IMetricsAdapter,
  ) => {
    const metricsAdapter: IMetricsAdapter = metricsAdapterInterceptor
      ? metricsAdapterInterceptor(new MockedMetricsAdapter())
      : new MockedMetricsAdapter();
    return {
      ...renderHook(() => useListBucketsForCurrentAccount({ metricsAdapter }), {
        wrapper: Wrapper,
      }),
      metricsAdapter,
    };
  };

  const setupAndRenderBucketLocationHook = (bucketName: string) => {
    return {
      ...renderHook(() => useBucketLocationConstraint({ bucketName }), {
        wrapper: Wrapper,
      }),
    };
  };

  const waitForPromiseResultToBeLoaded = async (
    result: PromiseResult<unknown>,
    waitFor: WaitFor,
    expectedStatus: PromiseStatus = 'success',
  ) => {
    const { status } = result;

    //Verify
    expect(status).toEqual('loading');

    //Exercise
    await waitFor(() => status === expectedStatus);
  };

  const waitForBucketsToBeLoaded = async (
    result: RenderResult<BucketsPromiseResult>,
    waitFor: WaitFor,
    expectedStatus: PromiseStatus = 'success',
  ) => {
    const { buckets } = result.current;

    //Exercise
    await waitForPromiseResultToBeLoaded(buckets, waitFor, expectedStatus);
  };

  const verifyBuckets = (
    result: RenderResult<BucketsPromiseResult>,
    expectedBuckets: { Name: string; CreationDate: Date }[],
    expectedLocations: Record<string, PromiseResult<string>>,
    expectedMetrics?: Record<string, PromiseResult<LatestUsedCapacity>>,
  ) => {
    const { buckets: resolvedBuckets } = result.current as {
      buckets: PromiseSucceedResult<Bucket[]>;
    };
    expect(resolvedBuckets.value.length).toEqual(defaultMockedBuckets.length);
    for (let i = 0; i < defaultMockedBuckets.length; i++) {
      expect(resolvedBuckets.value[i].name).toEqual(
        defaultMockedBuckets[i].Name,
      );
      expect(resolvedBuckets.value[i].creationDate).toEqual(
        defaultMockedBuckets[i].CreationDate,
      );
      if (expectedLocations[expectedBuckets[i].Name]) {
        expect(resolvedBuckets.value[i].locationConstraint).toEqual(
          expectedLocations[expectedBuckets[i].Name],
        );
      } else {
        expect(resolvedBuckets.value[i].locationConstraint).toEqual({
          status: 'idle',
        });
      }
      if (expectedMetrics && expectedMetrics[expectedBuckets[i].Name]) {
        expect(resolvedBuckets.value[i].usedCapacity).toEqual(
          expectedMetrics[expectedBuckets[i].Name],
        );
      } else {
        expect(resolvedBuckets.value[i].usedCapacity).toEqual({
          status: 'idle',
        });
      }
    }
  };

  const useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_20_buckets =
    async () => {
      //Setup
      server.use(
        mockBucketListing(tenThousandsBuckets),
        mockBucketLocationConstraint(''),
      );
      const EXPECTED_METRICS = tenThousandsBuckets
        .slice(0, 20)
        .map((bucket) => ({
          bucketName: bucket.Name,
          type: 'hasMetrics',
          usedCapacity: {
            current: 10,
            nonCurrent: 5,
          },
          measuredOn: new Date(),
        }))
        .reduce(
          (acc, bucketMetrics) => ({
            ...acc,
            [bucketMetrics.bucketName]: {
              type: bucketMetrics.type,
              usedCapacity: bucketMetrics.usedCapacity,
              measuredOn: bucketMetrics.measuredOn,
            },
          }),
          {},
        );
      const EXPECTED_METRICS_WRAPPED = Object.entries(EXPECTED_METRICS).reduce(
        (acc, [bucketName, metrics]) => ({
          ...acc,
          [bucketName]: { status: 'success', value: metrics },
        }),
        {},
      );
      const { result, waitFor } = setupAndRenderListBucketsHook(
        (metricsAdapter) => {
          metricsAdapter.listBucketsLatestUsedCapacity = jest
            .fn()
            .mockImplementation(async (buckets) => {
              if (buckets.length !== 20) {
                throw new Error('Unexpected number of buckets');
              }
              return EXPECTED_METRICS;
            });
          return metricsAdapter;
        },
      );

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      const EXPECTED_LOCATIONS = tenThousandsBuckets.slice(0, 20).reduce(
        (acc, bucket) => ({
          ...acc,
          [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
        }),
        {},
      );
      verifyBuckets(
        result,
        tenThousandsBuckets,
        EXPECTED_LOCATIONS,
        EXPECTED_METRICS_WRAPPED,
      );
      return { result, waitFor, EXPECTED_METRICS_WRAPPED };
    };

  describe('useListBucketsForCurrentAccount', () => {
    it('should first list all buckets', async () => {
      //Setup
      const { result, waitFor } = setupAndRenderListBucketsHook();

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      verifyBuckets(result, defaultMockedBuckets, {});
    });

    it('should return an error if the list buckets fails', async () => {
      //Setup
      server.use(mockBucketListing([], true));
      const { result, waitFor } = setupAndRenderListBucketsHook();

      //Exercise + Verify
      await waitForBucketsToBeLoaded(result, waitFor, 'error');
    });

    it('should return the location constraint for the first 20 buckets when location constraint is defined', async () => {
      //Setup
      const EXPECTED_LOCATION = 'us-east-2';
      server.use(
        mockBucketListing(tenThousandsBuckets),
        mockBucketLocationConstraint(EXPECTED_LOCATION),
      );
      const { result, waitFor } = setupAndRenderListBucketsHook();

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      const EXPECTED_LOCATIONS = tenThousandsBuckets.slice(0, 20).reduce(
        (acc, bucket) => ({
          ...acc,
          [bucket.Name]: { status: 'success', value: EXPECTED_LOCATION },
        }),
        {},
      );
      verifyBuckets(result, tenThousandsBuckets, EXPECTED_LOCATIONS);
    });

    it('should return the location constraint for the first 20 buckets when location constraint is not defined', async () => {
      //Setup
      server.use(
        mockBucketListing(tenThousandsBuckets),
        mockBucketLocationConstraint(''),
      );
      const { result, waitFor } = setupAndRenderListBucketsHook();

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      const EXPECTED_LOCATIONS = tenThousandsBuckets.slice(0, 20).reduce(
        (acc, bucket) => ({
          ...acc,
          [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
        }),
        {},
      );
      verifyBuckets(result, tenThousandsBuckets, EXPECTED_LOCATIONS);
    });

    it('should return an error if the location constraint fetching failed', async () => {
      //Setup
      server.use(
        mockBucketListing(tenThousandsBuckets),
        mockBucketLocationConstraint('', true),
      );
      const { result, waitFor } = setupAndRenderListBucketsHook();

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      const EXPECTED_LOCATIONS = tenThousandsBuckets.slice(0, 20).reduce(
        (acc, bucket) => ({
          ...acc,
          [bucket.Name]: {
            status: 'error',
            title: 'An error occurred while fetching the location',
            reason: 'Internal Server Error',
          },
        }),
        {},
      );
      verifyBuckets(result, tenThousandsBuckets, EXPECTED_LOCATIONS);
    });

    it('should return the latest used capacity for the first 20 buckets', async () => {
      await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_20_buckets();
    });

    it('should return an error if the latest used capacity fetching failed', async () => {
      //Setup
      server.use(
        mockBucketListing(tenThousandsBuckets),
        mockBucketLocationConstraint(''),
      );
      const { result, waitFor } = setupAndRenderListBucketsHook(
        (metricsAdapter) => {
          metricsAdapter.listBucketsLatestUsedCapacity = jest
            .fn()
            .mockImplementation(async () => {
              throw new Error('Internal Server Error');
            });
          return metricsAdapter;
        },
      );

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      const EXPECTED_LOCATIONS = tenThousandsBuckets.slice(0, 20).reduce(
        (acc, bucket) => ({
          ...acc,
          [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
        }),
        {},
      );
      verifyBuckets(
        result,
        tenThousandsBuckets,
        EXPECTED_LOCATIONS,
        tenThousandsBuckets.slice(0, 20).reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: {
              status: 'error',
              title:
                'An error occurred while fetching the latest used capacity',
              reason: 'Internal Server Error',
            },
          }),
          {},
        ),
      );
    });
  });

  describe('useBucketLocationConstraint', () => {
    it('should return the location constraint for a specific bucket', async () => {
      //Setup
      const EXPECTED_LOCATION = 'us-east-2';
      server.use(mockBucketLocationConstraint(EXPECTED_LOCATION));
      const BUCKET_NAME = 'bucket-name';
      const { result, waitFor } = setupAndRenderBucketLocationHook(BUCKET_NAME);
      //Exercise
      await waitForPromiseResultToBeLoaded(
        result.current.locationConstraint,
        waitFor,
      );
      //Verify
      expect(result.current.locationConstraint).toEqual({
        status: 'success',
        value: EXPECTED_LOCATION,
      });
    });

    it('should return an error if the location constraint fetching failed', async () => {
      //Setup
      server.use(mockBucketLocationConstraint('', true));
      const BUCKET_NAME = 'bucket-name';
      const { result, waitFor } = setupAndRenderBucketLocationHook(BUCKET_NAME);
      //Exercise
      await waitForPromiseResultToBeLoaded(
        result.current.locationConstraint,
        waitFor,
      );
      //Verify
      expect(result.current.locationConstraint).toEqual({
        status: 'error',
        title: 'An error occurred while fetching the location',
        reason: 'Internal Server Error',
      });
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the additional fetched information in case of success', async () => {
      //Setup
      const { result, EXPECTED_METRICS_WRAPPED } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_20_buckets();
      //Exercise
      const { result: result2, waitFor: waitFor2 } =
        setupAndRenderBucketLocationHook(tenThousandsBuckets[20].Name);
      await waitForPromiseResultToBeLoaded(
        result2.current.locationConstraint,
        waitFor2,
      );

      //Verify
      const EXPECTED_LOCATIONS = tenThousandsBuckets.slice(0, 21).reduce(
        (acc, bucket) => ({
          ...acc,
          [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
        }),
        {},
      );
      verifyBuckets(
        result,
        tenThousandsBuckets,
        EXPECTED_LOCATIONS,
        EXPECTED_METRICS_WRAPPED,
      );
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the error status and message in case of failure', async () => {
      //Setup
      const { result, EXPECTED_METRICS_WRAPPED } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_20_buckets();
      server.use(mockBucketLocationConstraint('', true));
      //Exercise
      const { result: result2, waitFor: waitFor2 } =
        setupAndRenderBucketLocationHook(tenThousandsBuckets[20].Name);
      await waitForPromiseResultToBeLoaded(
        result2.current.locationConstraint,
        waitFor2,
        'error',
      );

      //Verify
      const EXPECTED_LOCATIONS = tenThousandsBuckets.slice(0, 20).reduce(
        (acc, bucket) => ({
          ...acc,
          [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
        }),
        {},
      );
      //@ts-ignore
      EXPECTED_LOCATIONS[tenThousandsBuckets[20].Name] = {
        status: 'error',
        title: 'An error occurred while fetching the location',
        reason: 'Internal Server Error',
      };
      verifyBuckets(
        result,
        tenThousandsBuckets,
        EXPECTED_LOCATIONS,
        EXPECTED_METRICS_WRAPPED,
      );
    });
  });

  describe('useBucketLatestUsedCapacity', () => {
    it('should return the latest used capacity for a specific bucket', () => {
      // TODO
    });

    it('should return an error if the latest used capacity fetching failed', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the additional fetched information in case of success', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the error status and message in case of failure', () => {
      // TODO
    });
  });
});
