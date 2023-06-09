import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { mockOffsetSize } from '../../utils/testUtil';
import { EmptyBucketSummaryList } from '../EmptyBucket/EmptyBucketSummaryList';
import {
  DELETE_FAILED,
  DELETE_SUCCESS,
  TOTAL_ATTEMPTS,
} from '../EmptyBucket/constants';

const queryClient = new QueryClient();

type WrapperProps = { children?: React.ReactNode };

const Wrapper = ({ children }: WrapperProps) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </BrowserRouter>
);

beforeAll(() => {
  mockOffsetSize(500, 100);
});

describe('EmptySummaryList', () => {
  const data2 = [
    {
      attempts: 2,
      deleted: 1,
      errors: {
        nbErrors: 1,
        messages: ['Acces denied'],
      },
    },
  ];

  const selectors = {
    totalAttempts: () => screen.getByText(TOTAL_ATTEMPTS),
    successDeleted: () => screen.getByText(DELETE_SUCCESS),
    errorsDeleted: () => screen.getByText(DELETE_FAILED),
    objectsAttemptsNumber: (obj: number) =>
      screen.getByText(new RegExp(`${obj} objects`, 'i')),
    successIcon: () => screen.getByLabelText('Check-circle'),
    errorIcon: () => screen.getByLabelText('Exclamation-circle'),
  };

  it('should render', () => {
    render(
      <Wrapper>
        <EmptyBucketSummaryList summaryData={data2} />
      </Wrapper>,
    );
  });

  it('should display table columns correctly', () => {
    render(
      <Wrapper>
        <EmptyBucketSummaryList summaryData={data2} />
      </Wrapper>,
    );

    expect(selectors.totalAttempts()).toBeInTheDocument();
    expect(selectors.successDeleted()).toBeInTheDocument();
    expect(selectors.errorsDeleted()).toBeInTheDocument();
    expect(selectors.objectsAttemptsNumber(2)).toBeInTheDocument();
    expect(selectors.successIcon()).toBeInTheDocument();
    expect(selectors.errorIcon()).toBeInTheDocument();
  });
});
