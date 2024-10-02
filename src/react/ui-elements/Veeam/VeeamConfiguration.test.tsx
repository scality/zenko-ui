import { Stepper } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wrapper, selectClick } from '../../utils/testUtil';
import Configuration from './VeeamConfiguration';
import { VEEAM_BACKUP_REPLICATION } from './VeeamConstants';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';

jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => {
  return {
    useStepper: jest.fn(() => {
      return { next: jest.fn() };
    }),
  };
});

jest.mock('../../next-architecture/domain/business/accounts', () => ({
  useAccountsLocationsAndEndpoints: jest.fn(),
}));

const mockUseStepper = useStepper as jest.Mock;
const mockUseAccountsLocationsAndEndpoints =
  useAccountsLocationsAndEndpoints as jest.Mock;
describe('Veeam Configuration UI', () => {
  const selectors = {
    accountNameInput: () => screen.getByLabelText(/account/i),
    repositoryInput: () => screen.getByLabelText(/bucket name/i),
    maxCapacityInput: () =>
      screen.getByLabelText(/Max Veeam Repository Capacity/i),
    continueButton: () => screen.getByRole('button', { name: /Continue/i }),
    skipButton: () =>
      screen.getByRole('button', { name: /Skip Use case configuration/i }),
    title: () => screen.getByText(/Configure ARTESCA for your use case/i),
    veeamApplicationSelect: () => screen.getByLabelText(/Veeam application/i),
    veeamVBO: () =>
      screen.getByRole('option', {
        name: /Veeam Backup for Microsoft 365 \(v6, v7\)/i,
      }),
    veeamVBOV8: () =>
      screen.getByRole('option', {
        name: /Veeam Backup for Microsoft 365 \(v8\+\)/i,
      }),
  };

  const mockUseAccountsImplementation = () => {
    mockUseAccountsLocationsAndEndpoints.mockImplementation(() => {
      return {
        accountsLocationsAndEndpoints: {
          accounts: [
            {
              id: '345815413706',
              name: 'Veeam',
              canonicalId:
                'ae6aa5bca65ece94dc628eadad6cf857830b69c5866723dc6797d8c20b19b296',
              creationDate: '2024-03-18T16:55:49.000Z',
            },
          ],
        },
        status: 'success',
      };
    });
  };
  const renderVeeamConfigurationForm = () => {
    render(
      <Stepper
        steps={[
          {
            label: 'Configuration',
            Component: Configuration,
          },
        ]}
      />,
      { wrapper: Wrapper },
    );
  };

  it('should be able to set the Veeam configuration', async () => {
    //S
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    //V
    expect(selectors.title()).toBeInTheDocument();
    expect(selectors.continueButton()).toBeDisabled();
    expect(selectors.skipButton()).toBeEnabled();
    expect(
      screen.getByPlaceholderText(/example: veeam-backup/i),
    ).toBeInTheDocument();
    //E
    await userEvent.type(selectors.accountNameInput(), 'Veeam-test');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    //V
    expect(selectors.repositoryInput()).toHaveValue('veeam-bucket');
    // expect Veeam version is selected
    expect(
      screen.getByText(new RegExp(VEEAM_BACKUP_REPLICATION)),
    ).toBeInTheDocument();
    //expect the immutable backup toogle to be active
    expect(screen.getByLabelText('enableImmutableBackup')).toBeEnabled();
    // verify the max capacity input is prefilled with 80% of binary value of clusterCapacity: jestSetupAfterEnv.tsx
    expect(selectors.maxCapacityInput()).toHaveValue(3.73);
    expect(screen.getByText(/GiB/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(selectors.continueButton()).toBeEnabled();
    });
  });

  it('should hide immutable backup and Max Veeam Repository Capacity when Veeam Backup for Microsoft 365 v6 or v7 is selected', async () => {
    //Setup
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    //Exercise
    await selectClick(selectors.veeamApplicationSelect());
    await userEvent.click(selectors.veeamVBO());
    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
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
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    //Exercise
    await userEvent.click(selectors.skipButton());
    //Verify
    expect(screen.getByText(/Exit Veeam assistant?/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
  });

  it('should disable immutable backup when Veeam Backup for Microsoft 365 v6 or v7 is selected', async () => {
    const SUT = jest.fn();
    mockUseStepper.mockReturnValue({ next: SUT });
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();

    await selectClick(selectors.veeamApplicationSelect());
    await userEvent.click(selectors.veeamVBO());
    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    await userEvent.click(selectors.continueButton());

    expect(SUT).toHaveBeenCalledWith({
      accountName: 'Veeam',
      application: 'Veeam Backup for Microsoft 365 (v6, v7)',
      bucketName: 'veeam-bucket',
      capacityBytes: '4005057004',
      enableImmutableBackup: false,
    });
  });

  it('should show immutable backup but hide Max Veeam Repository Capacity when Veeam Backup for Microsoft 365 v8 is selected', async () => {
    const SUT = jest.fn();
    mockUseStepper.mockReturnValue({ next: SUT });
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();

    await selectClick(selectors.veeamApplicationSelect());
    await userEvent.click(selectors.veeamVBOV8());

    expect(
      screen.queryByText(/Max Veeam Repository Capacity/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Immutable Backup/i)).toBeInTheDocument();

    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');

    await userEvent.click(selectors.continueButton());

    expect(SUT).toHaveBeenCalledWith({
      accountName: 'Veeam',
      application: 'Veeam Backup for Microsoft 365 (v8+)',
      bucketName: 'veeam-bucket',
      capacityBytes: '4005057004',
      enableImmutableBackup: true,
    });
  });

  it('should display error in case of account name already exists', async () => {
    //S
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    //E
    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    //V
    await waitFor(() => {
      expect(
        screen.getByText(/Account name already exists/i),
      ).toBeInTheDocument();
    });
  });

  it('should prefilled with Veeam account is there is only scality internal account', async () => {
    //S
    mockUseAccountsLocationsAndEndpoints.mockImplementation(() => {
      return {
        accountsLocationsAndEndpoints: {
          accounts: [
            {
              id: '000000000000',
              name: 'scality-internal-services',
              canonicalId:
                '68c2e0ec05c3de60c8ea821e5ea08bfb324a847918bd3d0288b9349429e4f11f',
              creationDate: '2023-09-05T10:01:06.000Z',
            },
          ],
        },
        status: 'success',
      };
    });
    renderVeeamConfigurationForm();
    //V
    await waitFor(() => {
      expect(selectors.accountNameInput()).toHaveValue('Veeam');
    });
  });
  it('should show validation error if the max capacity is less than 1', async () => {
    //S
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    //E
    await userEvent.clear(selectors.maxCapacityInput());
    await userEvent.type(selectors.maxCapacityInput(), '0');
    //V
    expect(
      screen.getByText(/"capacity" must be larger than or equal to 1/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(selectors.continueButton()).toBeDisabled();
    });
  });
  it('should show validation error and disable continue button if the max capacity is more than 1024', async () => {
    //S
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    //E
    await userEvent.clear(selectors.maxCapacityInput());
    await userEvent.type(selectors.maxCapacityInput(), '1025');
    //V
    expect(
      screen.getByText(/"capacity" must be less than or equal to 1024/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(selectors.continueButton()).toBeDisabled();
    });
  });
  it('should show validation error and disable continue button if the max capacity is not a number', async () => {
    //S
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    //E
    await userEvent.clear(selectors.maxCapacityInput());
    await userEvent.type(selectors.maxCapacityInput(), 'abc');
    //V
    expect(
      screen.getByText(/"capacity" must be a number/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(selectors.continueButton()).toBeDisabled();
    });
  });
  it('should show validation error and disable continue button if the max capacity is empty', async () => {
    //S
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    //E
    await userEvent.clear(selectors.maxCapacityInput());
    //V
    expect(
      screen.getByText(/"capacity" must be a number/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(selectors.continueButton()).toBeDisabled();
    });
  });
  it('should show validation error if max capacity as more than 2 decimal points', async () => {
    //S
    mockUseAccountsImplementation();
    renderVeeamConfigurationForm();
    await userEvent.type(selectors.accountNameInput(), 'Veeam');
    await userEvent.type(selectors.repositoryInput(), 'veeam-bucket');
    //E
    await userEvent.clear(selectors.maxCapacityInput());
    await userEvent.type(selectors.maxCapacityInput(), '1.123');
    //V
    expect(
      screen.getByText(/"capacity" must have at most 2 decimals/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(selectors.continueButton()).toBeDisabled();
    });
  });
});
