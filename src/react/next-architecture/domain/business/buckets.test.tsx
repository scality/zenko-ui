import { useListBucketsForCurrentAccount } from './buckets';
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

describe('Buckets domain', () => {
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

  const setupAndRenderHook = () => {
    const metricsAdapter: IMetricsAdapter = new MockedMetricsAdapter();
    return {
      ...renderHook(() => useListBucketsForCurrentAccount({ metricsAdapter }), {
        wrapper: Wrapper,
      }),
      metricsAdapter,
    };
  };

  const waitForBucketsToBeLoaded = async (
    result: RenderResult<BucketsPromiseResult>,
    waitFor: WaitFor,
    expectedStatus: PromiseStatus = 'success',
  ) => {
    const { buckets } = result.current;

    //Verify
    expect(buckets.status).toEqual('loading');

    //Exercise
    await waitFor(() => buckets.status === expectedStatus);
  };

  const verifyBuckets = (
    result: RenderResult<BucketsPromiseResult>,
    expectedBuckets: { Name: string; CreationDate: Date }[],
    expectedLocation?: string,
    checkLocation = false,
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
      if (checkLocation) {
        expect(resolvedBuckets.value[i].locationConstraint).toEqual(
          expectedLocation,
        );
      }
      if (expectedMetrics) {
        expect(resolvedBuckets.value[i].usedCapacity).toEqual(
          expectedMetrics[expectedBuckets[i].Name],
        );
      }
    }
  };

  describe('useListBucketsForCurrentAccount', () => {
    it('should first list all buckets', async () => {
      //Setup
      const { result, waitFor } = setupAndRenderHook();

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      verifyBuckets(result, defaultMockedBuckets);
    });

    it('should return an error if the list buckets fails', async () => {
      //Setup
      server.use(mockBucketListing([], true));
      const { result, waitFor } = setupAndRenderHook();

      //Exercise + Verify
      await waitForBucketsToBeLoaded(result, waitFor, 'error');
    });

    it('should return the location constraint for the first 20 buckets when location constraint is defined', async () => {
      //Setup
      server.use(
        mockBucketListing(tenThousandsBuckets),
        mockBucketLocationConstraint('us-east-1'),
      );
      const { result, waitFor } = setupAndRenderHook();

      //Exercise
      await waitForBucketsToBeLoaded(result, waitFor);

      //Verify
      verifyBuckets(result, tenThousandsBuckets, 'us-east-1', true);
    });

    it('should return the location constraint for the first 20 buckets when location constraint is not defined', () => {
      //Setup
      server.use(
        mockBucketListing(tenThousandsBuckets),
        mockBucketLocationConstraint(''),
      );
      const { result, waitFor } = setupAndRenderHook();
    });

    it('should return an error if the location constraint fetching failed', () => {
      // TODO
    });

    it('should return the latest used capacity for the first 20 buckets', () => {
      // TODO
    });

    it('should return an error if the latest used capacity fetching failed', () => {
      // TODO
    });
  });

  describe('useBucketLocationConstraint', () => {
    it('should return the location constraint for a specific bucket', () => {
      // TODO
    });

    it('should return an error if the location constraint fetching failed', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the additional fetched information in case of success', () => {
      // TODO
    });

    it('should update the data returned by useListBucketsForCurrentAccount with the error status and message in case of failure', () => {
      // TODO
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
