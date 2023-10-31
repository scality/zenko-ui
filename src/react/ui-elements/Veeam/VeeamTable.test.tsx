import { render, screen, waitFor } from '@testing-library/react';
import VeeamTable from './VeeamTable';
import { QueryClient, QueryClientProvider } from 'react-query';
import { mockOffsetSize } from '../../utils/testUtil';

beforeAll(() => {
  mockOffsetSize(500, 500);
});

describe('VeeamTable', () => {
  const selectors = {
    cancelButton: () => screen.getByRole('button', { name: /Cancel/i }),
    continueButton: () => screen.getByRole('button', { name: /Continue/i }),
  };

  it('should render the Veeam table', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <VeeamTable />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Create an Account')).toBeInTheDocument();
    });

    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(selectors.cancelButton()).toBeDisabled();
    expect(selectors.continueButton()).toBeDisabled();
  });
});
