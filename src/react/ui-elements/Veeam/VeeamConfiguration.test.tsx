import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import Configuration from './VeeamConfiguration';
import { Stepper } from '@scality/core-ui';
import { VEEAM_BACKUP_REPLICATION } from './VeeamConstants';
import { selectClick } from '../../utils/testUtil';

describe('Veeam Configuration UI', () => {
  const selectors = {
    repositoryInput: () => screen.getByLabelText(/bucket name/i),
    continueButton: () => screen.getByRole('button', { name: /Continue/i }),
    skipButton: () =>
      screen.getByRole('button', { name: /Skip Use case configuration/i }),
    title: () => screen.getByText(/Prepare ARTESCA for Veeam/i),
    veeamApplicationSelect: () => screen.getByLabelText(/Veeam application/i),
    veeamVBO: () =>
      screen.getByRole('option', {
        name: /Veeam Backup for Microsoft Office 365/i,
      }),
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
    expect(
      screen.getByText(new RegExp(VEEAM_BACKUP_REPLICATION)),
    ).toBeInTheDocument();
    //expect the immutable backup toogle to be active
    expect(screen.getByLabelText('enableImmutableBackup')).toBeEnabled();

    await waitFor(() => {
      expect(selectors.continueButton()).toBeEnabled();
    });
  });

  it('should display clusterCapacity in default value with unit', async () => {
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

    expect(screen.getByDisplayValue(/4.66/i)).toBeInTheDocument();
    expect(screen.getByText(/GiB/i)).toBeInTheDocument();
  });

  it('should hide immutable backup and Max Veeam Repository Capacity when Veeam Backup for Microsoft Office 365 is selected', async () => {
    //Setup
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
    //Exercise
    selectClick(selectors.veeamApplicationSelect());
    userEvent.click(selectors.veeamVBO());
    userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    //Verify
    expect(
      screen.queryByText(/Max Veeam Repository Capacity/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Immutable Backup/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(selectors.continueButton()).toBeEnabled();
    });
  });

  it('should open veeam skip modal when skip button is clicked', async () => {
    //Setup
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
    //Exercise
    userEvent.click(selectors.skipButton());
    //Verify
    expect(screen.getByText(/Exit Veeam assistant?/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
  });
});
