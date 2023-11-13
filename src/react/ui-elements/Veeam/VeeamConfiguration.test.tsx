import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import Configuration from './VeeamConfiguration';
import { Stepper } from '@scality/core-ui';

describe('Veeam Configuration UI', () => {
  const selectors = {
    repositoryInput: () => screen.getByLabelText(/bucket name/i),
    continueButton: () => screen.getByRole('button', { name: /Continue/i }),
    skipButton: () =>
      screen.getByRole('button', { name: /Skip Use case configuration/i }),
    title: () => screen.getByText(/Prepare ARTESCA for Veeam/i),
  };

  it('should be able to set the Veeam configuration', async () => {
    //S
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Stepper
          steps={[
            {
              label: 'Configuration',
              Component: Configuration,
            },
          ]}
        />
      </QueryClientProvider>,
    );
    //V
    expect(selectors.title()).toBeInTheDocument();
    expect(selectors.continueButton()).toBeDisabled();
    expect(selectors.skipButton()).toBeEnabled();
    //E
    userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    //V
    expect(selectors.repositoryInput()).toHaveValue('veeam-bucket');
    // expect Veeam version is selected
    expect(screen.getByText(/Veeam 12/i)).toBeInTheDocument();
    //expect the immutable backup toogle to be active
    expect(screen.getByText('Active')).toBeEnabled();

    await waitFor(() => {
      expect(selectors.continueButton()).toBeEnabled();
    });
  });
});
