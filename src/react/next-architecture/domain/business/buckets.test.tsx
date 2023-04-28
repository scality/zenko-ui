import {
  DEFAULT_LOCATION,
  useBucketLatestUsedCapacity,
  useBucketLocationConstraint,
  useListBucketsForCurrentAccount,
} from './buckets';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import { RenderResult, WaitFor } from '@testing-library/react-hooks';
import { MockedMetricsAdapter } from '../../adapters/metrics/MockedMetricsAdapter';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from 'react-query';
import { PropsWithChildren } from 'react';
import { ConfigProvider } from '../../ui/ConfigProvider';
import { S3ClientProvider } from '../../ui/S3ClientProvider';
import { MemoryRouter } from 'react-router';
import {
  PromiseResult,
  PromiseStatus,
  PromiseSucceedResult,
} from '../entities/promise';
import { Bucket, BucketsPromiseResult } from '../entities/bucket';
import { LatestUsedCapacity } from '../entities/metrics';
import { AppConfig } from '../../../../types/entities';
import { XDM_FEATURE } from '../../../../js/config';
import {
  prepareRenderMultipleHooks,
  RenderAdditionalHook,
} from '../../../utils/testMultipleHooks';
import { _AuthContext } from '../../ui/AuthProvider';

jest.setTimeout(30000);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const ACCESS_TOKEN = 'token';
const config: AppConfig = {
  zenkoEndpoint: 'http://localhost:8000',
  stsEndpoint: 'http://localhost:9000',
  iamEndpoint: 'http://localhost:10000',
  managementEndpoint: 'http://localhost:11000',
  navbarEndpoint: 'http://localhost:12000',
  navbarConfigUrl: 'http://localhost:13000',
  features: [XDM_FEATURE],
};
const Wrapper = ({ children }: PropsWithChildren<Record<string, never>>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <_AuthContext.Provider
          value={{
            //@ts-ignore
            user: { access_token: ACCESS_TOKEN, profile: { sub: 'test' } },
          }}
        >
          <ConfigProvider>
            <S3ClientProvider
              configuration={{
                endpoint: config.zenkoEndpoint,
                s3ForcePathStyle: true,
                credentials: {
                  accessKeyId: 'accessKey',
                  secretAccessKey: 'secretKey',
                },
              }}
            >
              {children}
            </S3ClientProvider>
          </ConfigProvider>
        </_AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
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

const metricsPageSize = 1_000;
const locationPageSize = 20;
const thousandAnd2Buckets = Array.from(
  { length: metricsPageSize + 2 },
  (_, i) => ({
    Name: `bucket${i}`,
    CreationDate: frozenDate,
  }),
);

describe('Buckets domain', () => {
  function mockConfig() {
    return rest.get(`http://localhost/config.json`, (req, res, ctx) => {
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
    {
      location,
      slowdown,
      forceFailure,
    }: { location?: string; slowdown?: boolean; forceFailure?: boolean } = {
      slowdown: false,
      forceFailure: false,
    },
  ) {
    return rest.get(
      `${config.zenkoEndpoint}/:bucketName`,
      async (req, res, ctx) => {
        if (!req.url.searchParams.has('location')) {
          return res(ctx.status(404));
        }

        if (forceFailure) {
          return res(ctx.status(500));
        }

        if (slowdown) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return res(
          ctx.xml(`
          <?xml version="1.0" encoding="UTF-8"?>
          <LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            <LocationConstraint>${location}</LocationConstraint>
          </LocationConstraint>
        `),
        );
      },
    );
  }

  const server = setupServer(
    mockConfig(),
    mockBucketListing(),
    mockBucketLocationConstraint({ slowdown: true }),
  );

  beforeEach(() => {
    queryClient.clear();
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const setupAndRenderListBucketsHook = async (
    metricsAdapterInterceptor?: (
      metricsAdapter: IMetricsAdapter,
    ) => IMetricsAdapter,
  ) => {
    const metricsAdapter: IMetricsAdapter = metricsAdapterInterceptor
      ? metricsAdapterInterceptor(new MockedMetricsAdapter())
      : new MockedMetricsAdapter();

    const { renderAdditionalHook, waitForWrapperToBeReady } =
      prepareRenderMultipleHooks({
        wrapper: Wrapper,
      });
    await waitForWrapperToBeReady();
    const { result, waitFor, waitForValueToBeUpdated } = renderAdditionalHook(
      'listBuckets',
      () => useListBucketsForCurrentAccount({ metricsAdapter }),
    );
    return {
      result,
      waitFor,
      waitForValueToBeUpdated,
      renderAdditionalHook,
      metricsAdapter,
      waitForListBucketsHookValueToChange: async () => {
        await waitForValueToBeUpdated('listBuckets');
      },
    };
  };

  const setupAndRenderBucketLocationHook = async (
    bucketName: string,
    renderAdditionalHook?: RenderAdditionalHook,
  ) => {
    if (!renderAdditionalHook) {
      const prepared = prepareRenderMultipleHooks({
        wrapper: Wrapper,
      });

      renderAdditionalHook = prepared.renderAdditionalHook;
      await prepared.waitForWrapperToBeReady();
    }
    return {
      ...renderAdditionalHook('bucketLocation', () =>
        useBucketLocationConstraint({ bucketName }),
      ),
      renderAdditionalHook,
    };
  };

  const setupAndRenderBucketCapacityHook = async (
    bucketName: string,
    metricsAdapterInterceptor?: (
      metricsAdapter: IMetricsAdapter,
    ) => IMetricsAdapter,
    renderAdditionalHook?: RenderAdditionalHook,
  ) => {
    const metricsAdapter: IMetricsAdapter = metricsAdapterInterceptor
      ? metricsAdapterInterceptor(new MockedMetricsAdapter())
      : new MockedMetricsAdapter();
    if (!renderAdditionalHook) {
      const prepared = prepareRenderMultipleHooks({
        wrapper: Wrapper,
      });

      renderAdditionalHook = prepared.renderAdditionalHook;
      await prepared.waitForWrapperToBeReady();
    }
    return {
      ...renderAdditionalHook('bucketCapacity', () =>
        useBucketLatestUsedCapacity({ bucketName, metricsAdapter }),
      ),
      renderAdditionalHook,
      metricsAdapter,
    };
  };

  const waitForPromiseResultToBeLoaded = async (
    resultFn: () => PromiseResult<unknown>,
    waitFor: WaitFor,
    expectedStatus: PromiseStatus = 'success',
  ) => {
    await waitFor(() => {
      return resultFn() !== undefined;
    });

    //Exercise
    await waitFor(() => resultFn().status === expectedStatus, {
      timeout: 5000,
    });
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
    expect(resolvedBuckets.value.length).toEqual(expectedBuckets.length);
    for (let i = 0; i < expectedBuckets.length; i++) {
      expect(resolvedBuckets.value[i].name).toEqual(expectedBuckets[i].Name);
      expect(resolvedBuckets.value[i].creationDate).toEqual(
        expectedBuckets[i].CreationDate,
      );
      if (expectedLocations[expectedBuckets[i].Name]) {
        expect(resolvedBuckets.value[i].locationConstraint).toEqual(
          expectedLocations[expectedBuckets[i].Name],
        );
      } else {
        expect(resolvedBuckets.value[i].locationConstraint).toEqual({
          status: 'loading',
        });
      }
      if (expectedMetrics && expectedMetrics[expectedBuckets[i].Name]) {
        expect(resolvedBuckets.value[i].usedCapacity).toEqual(
          expectedMetrics[expectedBuckets[i].Name],
        );
      } else {
        expect(resolvedBuckets.value[i].usedCapacity).toEqual({
          status: 'loading',
        });
      }
    }
  };

  const useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets =
    async () => {
      //Setup
      server.use(
        mockBucketListing(thousandAnd2Buckets),
        mockBucketLocationConstraint({ location: '' }),
      );
      const EXPECTED_METRICS = thousandAnd2Buckets
        .slice(0, metricsPageSize)
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
      const {
        result,
        waitFor,
        renderAdditionalHook,
        waitForListBucketsHookValueToChange,
      } = await setupAndRenderListBucketsHook((metricsAdapter) => {
        metricsAdapter.listBucketsLatestUsedCapacity = jest
          .fn()
          .mockImplementation(async (buckets) => {
            if (buckets.length !== metricsPageSize) {
              throw new Error(
                `Unexpected number of buckets expected: ${metricsPageSize}, got: ${buckets.length}`,
              );
            }
            return EXPECTED_METRICS;
          });
        return metricsAdapter;
      });

      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.buckets,
        waitFor,
      );

      //Wait for the location constraint to be loaded
      await waitFor(() => {
        const { buckets } = result.current as {
          buckets: PromiseSucceedResult<Bucket[]>;
        };
        return buckets.value
          .slice(0, locationPageSize)
          .every((bucket) => bucket.locationConstraint.status !== 'loading');
      });

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
          }),
          {},
        );
      verifyBuckets(
        result,
        thousandAnd2Buckets,
        EXPECTED_LOCATIONS,
        EXPECTED_METRICS_WRAPPED,
      );
      return {
        result,
        waitFor,
        EXPECTED_METRICS_WRAPPED,
        renderAdditionalHook,
        waitForListBucketsHookValueToChange,
      };
    };

  describe('useListBucketsForCurrentAccount', () => {
    it('should first list all buckets', async () => {
      //Setup
      const { result, waitFor } = await setupAndRenderListBucketsHook();

      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.buckets,
        waitFor,
      );

      //Verify
      const expectedLocations = defaultMockedBuckets.reduce(
        (acc, bucket) => ({ ...acc, [bucket.Name]: { status: 'loading' } }),
        {},
      );
      verifyBuckets(result, defaultMockedBuckets, expectedLocations);
    });

    it('should return an error if the list buckets fails', async () => {
      //Setup
      server.use(mockBucketListing([], true));
      const { result, waitFor } = await setupAndRenderListBucketsHook();

      //Exercise + Verify
      await waitForPromiseResultToBeLoaded(
        () => result.current.buckets,
        waitFor,
        'error',
      );
    });

    it('should return the location constraint for the first 20 buckets when location constraint is defined', async () => {
      //Setup
      const EXPECTED_LOCATION = 'us-east-2';
      server.use(
        mockBucketListing(thousandAnd2Buckets),
        mockBucketLocationConstraint({ location: EXPECTED_LOCATION }),
      );
      const { result, waitFor } = await setupAndRenderListBucketsHook();

      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.buckets,
        waitFor,
      );

      //Wait for the location constraint to be loaded
      await waitFor(() => {
        const { buckets } = result.current as {
          buckets: PromiseSucceedResult<Bucket[]>;
        };
        return buckets.value
          .slice(0, locationPageSize)
          .every((bucket) => bucket.locationConstraint.status === 'success');
      });

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: EXPECTED_LOCATION },
          }),
          {},
        );
      verifyBuckets(result, thousandAnd2Buckets, EXPECTED_LOCATIONS);
    });

    it('should return the location constraint for the first 20 buckets when location constraint is not defined', async () => {
      //Setup
      server.use(
        mockBucketListing(thousandAnd2Buckets),
        mockBucketLocationConstraint({ location: '' }),
      );
      const { result, waitFor } = await setupAndRenderListBucketsHook();

      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.buckets,
        waitFor,
      );

      //Wait for the location constraint to be loaded
      await waitFor(() => {
        const { buckets } = result.current as {
          buckets: PromiseSucceedResult<Bucket[]>;
        };
        return buckets.value
          .slice(0, locationPageSize)
          .every((bucket) => bucket.locationConstraint.status === 'success');
      });

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
          }),
          {},
        );
      verifyBuckets(result, thousandAnd2Buckets, EXPECTED_LOCATIONS);
    });

    it('should return an error if the location constraint fetching failed', async () => {
      //Setup
      server.use(
        mockBucketListing(thousandAnd2Buckets),
        mockBucketLocationConstraint({ location: '', forceFailure: true }),
      );
      const { result, waitFor } = await setupAndRenderListBucketsHook();

      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.buckets,
        waitFor,
      );

      //Wait for the location constraint to be loaded
      await waitFor(
        () => {
          const { buckets } = result.current as {
            buckets: PromiseSucceedResult<Bucket[]>;
          };
          return buckets.value
            .slice(0, locationPageSize)
            .every((bucket) => bucket.locationConstraint.status !== 'loading');
        },
        { timeout: 10_000 },
      );

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
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
      verifyBuckets(result, thousandAnd2Buckets, EXPECTED_LOCATIONS);
    });

    it('should return the latest used capacity for the first 1000 buckets', async () => {
      await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets();
    });

    it('should return an error if the latest used capacity fetching failed', async () => {
      //Setup
      server.use(
        mockBucketListing(thousandAnd2Buckets),
        mockBucketLocationConstraint({ location: '' }),
      );
      const { result, waitFor } = await setupAndRenderListBucketsHook(
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
      await waitForPromiseResultToBeLoaded(
        () => result.current.buckets,
        waitFor,
      );

      //Wait for the metrics to be loaded
      await waitFor(
        () => {
          const { buckets } = result.current as {
            buckets: PromiseSucceedResult<Bucket[]>;
          };
          return buckets.value
            .slice(0, locationPageSize)
            .every((bucket) => bucket.usedCapacity.status !== 'loading');
        },
        { timeout: 10_000 },
      );

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
          }),
          {},
        );
      verifyBuckets(
        result,
        thousandAnd2Buckets,
        EXPECTED_LOCATIONS,
        thousandAnd2Buckets.slice(0, metricsPageSize).reduce(
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
      server.use(mockBucketLocationConstraint({ location: EXPECTED_LOCATION }));
      const BUCKET_NAME = 'bucket-name';
      const { result, waitFor } = await setupAndRenderBucketLocationHook(
        BUCKET_NAME,
      );
      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.locationConstraint,
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
      server.use(
        mockBucketLocationConstraint({ location: '', forceFailure: true }),
      );
      const BUCKET_NAME = 'bucket-name';
      const { result, waitFor } = await setupAndRenderBucketLocationHook(
        BUCKET_NAME,
      );
      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.locationConstraint,
        waitFor,
        'error',
      );
      //Verify
      expect(result.current.locationConstraint).toEqual({
        status: 'error',
        title: 'An error occurred while fetching the location',
        reason: 'Internal Server Error',
      });
    });

    it('should return the location directly when it has already been fetched by the useListBucketsForCurrentAccount hook', async () => {
      //Setup
      const { renderAdditionalHook } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets();
      //Exercise

      const { result: result2 } = await setupAndRenderBucketLocationHook(
        thousandAnd2Buckets[locationPageSize - 1].Name,
        renderAdditionalHook,
      );

      //Verify
      expect(result2.current.locationConstraint).toEqual({
        status: 'success',
        value: DEFAULT_LOCATION,
      });
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the additional fetched information in case of success', async () => {
      //Setup
      const {
        result,
        EXPECTED_METRICS_WRAPPED,
        renderAdditionalHook,
        waitFor,
      } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets();
      //Exercise
      const { result: result2, waitFor: waitFor2 } =
        await setupAndRenderBucketLocationHook(
          thousandAnd2Buckets[locationPageSize].Name,
          renderAdditionalHook,
        );
      await waitForPromiseResultToBeLoaded(
        () => result2.current.locationConstraint,
        waitFor2,
      );

      await waitFor(
        () => {
          const { buckets } = result.current as {
            buckets: PromiseSucceedResult<Bucket[]>;
          };
          return buckets.value
            .slice(0, locationPageSize + 1)
            .every((bucket) => bucket.locationConstraint.status !== 'loading');
        },
        { timeout: 10_000 },
      );

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize + 1)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
          }),
          {},
        );
      verifyBuckets(
        result,
        thousandAnd2Buckets,
        EXPECTED_LOCATIONS,
        EXPECTED_METRICS_WRAPPED,
      );
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the error status and message in case of failure', async () => {
      //Setup
      const { result, EXPECTED_METRICS_WRAPPED, renderAdditionalHook } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets();
      server.use(
        mockBucketLocationConstraint({ location: '', forceFailure: true }),
      );
      //Exercise
      const { result: result2, waitFor: waitFor2 } =
        await setupAndRenderBucketLocationHook(
          thousandAnd2Buckets[locationPageSize].Name,
          renderAdditionalHook,
        );
      await waitForPromiseResultToBeLoaded(
        () => result2.current.locationConstraint,
        waitFor2,
        'error',
      );

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
          }),
          {},
        );
      //@ts-ignore
      EXPECTED_LOCATIONS[thousandAnd2Buckets[locationPageSize].Name] = {
        status: 'error',
        title: 'An error occurred while fetching the location',
        reason: 'Internal Server Error',
      };
      verifyBuckets(
        result,
        thousandAnd2Buckets,
        EXPECTED_LOCATIONS,
        EXPECTED_METRICS_WRAPPED,
      );
    });
  });

  describe('useBucketLatestUsedCapacity', () => {
    it('should return the latest used capacity for a specific bucket', async () => {
      //Setup
      const BUCKET_NAME = 'bucket-name';
      const EXPECTED_METRICS = {
        [BUCKET_NAME]: {
          type: 'hasMetrics',
          usedCapacity: {
            current: 12,
            nonCurrent: 6,
          },
          measuredOn: new Date(),
        },
      };
      const { result, waitFor } = await setupAndRenderBucketCapacityHook(
        BUCKET_NAME,
        (metricsAdapter) => {
          metricsAdapter.listBucketsLatestUsedCapacity = jest
            .fn()
            .mockImplementation(async (buckets) => {
              if (buckets.length !== 1) {
                throw new Error('Unexpected number of buckets');
              }
              return EXPECTED_METRICS;
            });
          return metricsAdapter;
        },
      );
      //Exercise
      await waitForPromiseResultToBeLoaded(
        () => result.current.usedCapacity,
        waitFor,
      );
      //Verify
      expect(result.current.usedCapacity).toEqual({
        status: 'success',
        value: EXPECTED_METRICS[BUCKET_NAME],
      });
    });

    it('should return an error if the latest used capacity fetching failed', async () => {
      //Setup
      const BUCKET_NAME = 'bucket-name';
      const { result, waitFor } = await setupAndRenderBucketCapacityHook(
        BUCKET_NAME,
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
      await waitForPromiseResultToBeLoaded(
        () => result.current.usedCapacity,
        waitFor,
        'error',
      );
      //Verify
      expect(result.current.usedCapacity).toEqual({
        status: 'error',
        title: 'An error occurred while fetching the latest used capacity',
        reason: 'Internal Server Error',
      });
    });

    it('should return the metrics directly when it has already been fetched by the useListBucketsForCurrentAccount hook', async () => {
      //Setup
      const { renderAdditionalHook, EXPECTED_METRICS_WRAPPED } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets();
      //Exercise

      const { result: result2 } = await setupAndRenderBucketCapacityHook(
        thousandAnd2Buckets[metricsPageSize - 1].Name,
        (metricsAdapter) => metricsAdapter,
        renderAdditionalHook,
      );

      //Verify
      expect(result2.current.usedCapacity).toEqual(
        EXPECTED_METRICS_WRAPPED[thousandAnd2Buckets[metricsPageSize - 1].Name],
      );
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the additional fetched information in case of success', async () => {
      //Setup
      const {
        result,
        EXPECTED_METRICS_WRAPPED,
        renderAdditionalHook,
        waitFor,
      } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets();

      const EXPECTED_ADDITIONAL_METRICS = {
        [thousandAnd2Buckets[metricsPageSize].Name]: {
          type: 'hasMetrics',
          usedCapacity: {
            current: 12,
            nonCurrent: 6,
          },
          measuredOn: new Date(),
        },
      };

      //Exercise
      const { result: result2, waitFor: waitFor2 } =
        await setupAndRenderBucketCapacityHook(
          thousandAnd2Buckets[metricsPageSize].Name,
          (metricsAdapter) => {
            metricsAdapter.listBucketsLatestUsedCapacity = jest
              .fn()
              .mockImplementation(async (buckets) => {
                if (buckets.length !== 1) {
                  throw new Error('Unexpected number of buckets');
                }
                return EXPECTED_ADDITIONAL_METRICS;
              });
            return metricsAdapter;
          },
          renderAdditionalHook,
        );

      await waitForPromiseResultToBeLoaded(
        () => result2.current.usedCapacity,
        waitFor2,
      );

      //wait for the useListBucketsForCurrentAccount to be updated
      await waitFor(() => {
        return (
          result.current.buckets.status === 'success' &&
          result.current.buckets.value[metricsPageSize].usedCapacity.status ===
            'success'
        );
      });

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
          }),
          {},
        );
      verifyBuckets(result, thousandAnd2Buckets, EXPECTED_LOCATIONS, {
        ...EXPECTED_METRICS_WRAPPED,
        [thousandAnd2Buckets[metricsPageSize].Name]: {
          status: 'success',
          value:
            EXPECTED_ADDITIONAL_METRICS[
              thousandAnd2Buckets[metricsPageSize].Name
            ],
        },
      });
    });

    it('should not update the data returned by useListBucketsForCurrentAccount with the error status and message in case of failure', async () => {
      //Setup
      const { result, EXPECTED_METRICS_WRAPPED, renderAdditionalHook } =
        await useListBucketsForCurrentAccount_should_return_the_latest_used_capacity_for_the_first_1000_buckets();

      //Exercise
      const { result: result2, waitFor: waitFor2 } =
        await setupAndRenderBucketCapacityHook(
          thousandAnd2Buckets[metricsPageSize].Name,
          (metricsAdapter) => {
            metricsAdapter.listBucketsLatestUsedCapacity = jest
              .fn()
              .mockImplementation(async () => {
                throw new Error('Internal Server Error');
              });
            return metricsAdapter;
          },
          renderAdditionalHook,
        );

      await waitForPromiseResultToBeLoaded(
        () => result2.current.usedCapacity,
        waitFor2,
        'error',
      );

      //Verify
      const EXPECTED_LOCATIONS = thousandAnd2Buckets
        .slice(0, locationPageSize)
        .reduce(
          (acc, bucket) => ({
            ...acc,
            [bucket.Name]: { status: 'success', value: DEFAULT_LOCATION },
          }),
          {},
        );
      verifyBuckets(result, thousandAnd2Buckets, EXPECTED_LOCATIONS, {
        ...EXPECTED_METRICS_WRAPPED,
        [thousandAnd2Buckets[metricsPageSize].Name]: {
          status: 'loading',
        },
      });
    });
  });
});
