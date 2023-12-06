import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { VeeamCapacityOverviewRow } from './VeeamCapacityOverviewRow';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { bucketName } from '../../../js/mock/S3Client';
import { NewWrapper, TEST_API_BASE_URL } from '../../utils/testUtil';
import { VEEAM_XML_PREFIX } from './VeeamConstants';

const queryClient = new QueryClient();

describe('VeeamCapacityOverviewRow', () => {
  const server = setupServer(
    rest.get(
      `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`,
      (req, res, ctx) => {
        return res(ctx.status(200));
      },
    ),
  );
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => server.close());

  it('should render the row', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <VeeamCapacityOverviewRow bucketName="testBucket" />
      </QueryClientProvider>,
      { wrapper: NewWrapper() },
    );
    expect(screen.getByText('Max repository Capacity')).toBeInTheDocument();
    expect(screen.getByText('100 B')).toBeInTheDocument();
  });

  it('should not render the row if SOSAPI is not enabled', () => {
    mockUseBucketTagging.mockReturnValue({
      status: 'success',
      value: { BUCKET_TAG_VEEAM_APPLICATION: 'OTHER_APPLICATION' },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <VeeamCapacityOverviewRow bucketName="testBucket" />
      </QueryClientProvider>,
    );
    expect(
      screen.queryByText('Max repository Capacity'),
    ).not.toBeInTheDocument();
  });

  it('should display loading state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      status: 'loading',
    });
    render(
      <QueryClientProvider client={queryClient}>
        <VeeamCapacityOverviewRow bucketName="testBucket" />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      status: 'error',
    });
    render(
      <QueryClientProvider client={queryClient}>
        <VeeamCapacityOverviewRow bucketName="testBucket" />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
