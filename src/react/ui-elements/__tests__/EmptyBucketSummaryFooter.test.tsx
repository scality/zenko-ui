import { QueryClient, QueryClientProvider } from 'react-query';
import { render, fireEvent } from '@testing-library/react';
import { EmptyBucketSummaryFooter } from '../EmptyBucket/EmptyBucketSummaryFooter';

const queryClient = new QueryClient();

type WrapperProps = { children?: React.ReactNode };
const Wrapper = ({ children }: WrapperProps) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('EmptyBucketSummaryFooter', () => {
  it('should render', () => {
    render(
      <Wrapper>
        <EmptyBucketSummaryFooter close={() => {}} />
      </Wrapper>,
    );
  });

  it('should render the close button', () => {
    const { getByText } = render(
      <Wrapper>
        <EmptyBucketSummaryFooter close={() => {}} />
      </Wrapper>,
    );
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('should call the close function when the close button is clicked', () => {
    const closeMock = jest.fn();
    const { getByText } = render(
      <EmptyBucketSummaryFooter close={closeMock} />,
    );
    const closeButton = getByText('Close');

    fireEvent.click(closeButton);

    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
