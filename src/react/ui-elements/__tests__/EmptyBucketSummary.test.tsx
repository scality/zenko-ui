import { render, screen } from '@testing-library/react';
import { EmptyBucketSummary } from '../EmptyBucket/EmptyBucketSummary';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient();

type WrapperProps = { children?: React.ReactNode };
const Wrapper = ({ children }: WrapperProps) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </BrowserRouter>
);

const mockDeleteResult = {
  Deleted: [
    { Key: 'object-key-1', VersionId: 'version-id-1' },
    { Key: 'object-key-2', VersionId: 'version-id-2' },
  ],
  Errors: [{ Key: 'object-key-3', Code: 'Error', Message: 'Error message' }],
};

describe('EmptyBucketSummary', () => {
  it('should render', () => {
    const { getByText } = render(
      <Wrapper>
        <EmptyBucketSummary
          deleteResult={mockDeleteResult}
          onClose={() => {}}
          open
          isFetchNextPage
        />
      </Wrapper>,
    );

    expect(getByText('Summary')).toBeInTheDocument();
  });

  it('should render the EmptySummaryList with the correct data', () => {
    const { getByText } = render(
      <Wrapper>
        <EmptyBucketSummary
          deleteResult={mockDeleteResult}
          onClose={() => {}}
          open
          isFetchNextPage
        />
      </Wrapper>,
    );

    expect(getByText('Total attempts')).toBeInTheDocument();
    expect(getByText('Successfully deleted')).toBeInTheDocument();
    expect(getByText('Deletion failed')).toBeInTheDocument();
  });

  it('should render the EmptySummaryFooter', () => {
    const { getByText } = render(
      <Wrapper>
        <EmptyBucketSummary
          deleteResult={mockDeleteResult}
          onClose={() => {}}
          open
          isFetchNextPage
        />
      </Wrapper>,
    );

    expect(getByText('Close')).toBeInTheDocument();
  });

  it('should display banner if bucket is too heavy', () => {
    render(
      <Wrapper>
        <EmptyBucketSummary
          deleteResult={mockDeleteResult}
          onClose={() => {}}
          open
          isFetchNextPage={false}
        />
      </Wrapper>,
    );

    const bannerElement = screen.getByText(
      /Your bucket contains too many objects./i,
    );

    expect(bannerElement).toBeInTheDocument();
  });
});
