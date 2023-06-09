import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { EmptyBucketModalFooter } from '../EmptyBucket/EmptyBucketModalFooter';

const queryClient = new QueryClient();

type WrapperProps = { children?: React.ReactNode };
const Wrapper = ({ children }: WrapperProps) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('EmptyBucketModalFooter', () => {
  const selectors = {
    deletionText: (deleteNumber: number) =>
      screen.getByText(`${deleteNumber} deletion attempts...`),
    cancelText: () => screen.getByText(/Cancel/i),
    emptyText: () => screen.getByText(/Empty/i),
    emptyButton: () => screen.getByRole('button', { name: /Empty/i }),
  };

  it('should render', () => {
    render(
      <Wrapper>
        <EmptyBucketModalFooter approve={jest.fn()} cancel={jest.fn()} />
      </Wrapper>,
    );
  });

  it('should display the delete count when loading is true', () => {
    const deleteNumber = 5;

    render(
      <Wrapper>
        <EmptyBucketModalFooter
          approve={jest.fn()}
          cancel={jest.fn()}
          loading
          deleteNumber={deleteNumber}
        />
      </Wrapper>,
    );

    expect(selectors.deletionText(deleteNumber)).toBeInTheDocument();
  });

  it('should render the cancel and approve buttons', () => {
    render(
      <Wrapper>
        <EmptyBucketModalFooter approve={jest.fn()} cancel={jest.fn()} />
      </Wrapper>,
    );

    expect(selectors.cancelText()).toBeInTheDocument();
    expect(selectors.emptyText()).toBeInTheDocument();
  });

  it("should disable the approve button when user don't type 'confirm' ", () => {
    const approveMock = jest.fn();
    render(
      <Wrapper>
        <EmptyBucketModalFooter
          approve={approveMock}
          cancel={() => {}}
          isConfirm={false}
          loading
        />
      </Wrapper>,
    );

    expect(selectors.emptyButton()).toBeDisabled();
  });
});
