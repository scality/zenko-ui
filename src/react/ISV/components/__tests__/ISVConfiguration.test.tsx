import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ISVConfiguration } from '../ISVConfiguration';
import { ISVStepperContext } from '../ISVSteps';
import { useListAccounts } from '../../../next-architecture/domain/business/accounts';
import { Veeam } from '../../modules/veeam';
import { Commvault } from '../../modules/commvault';
import { VeeamVBO } from '../../modules/veeam-vbo';
import { VEEAM_OFFICE_365 } from '../../constants';
import { renderWithCustomRoute, Wrapper } from '../../../utils/testUtil';
import { debug } from 'jest-preview';

const mockNavigate = jest.fn();
jest.mock('@scality/module-federation', () => ({
  useShellHooks: jest.fn(),
  useBasenameRelativeNavigate: jest.fn().mockImplementation(() => mockNavigate),
}));

// Mock domain hooks
jest.mock('../../../next-architecture/domain/business/accounts', () => ({
  useListAccounts: jest.fn(),
}));

// Mock IAM hook
jest.mock('../../hooks/useIAMUser', () => ({
  useIAMUser: jest.fn().mockReturnValue({
    isIAMUserExist: false,
    IAMUsersStatus: 'success',
    IAMUsers: [{ id: '1', name: 'test-user' }],
    getIAMUsersMutation: { mutate: jest.fn() },
    accessKeys: null,
  }),
}));

// Mock stepper hook
jest.mock(
  '@scality/core-ui/dist/components/steppers/Stepper.component',
  () => ({
    useStepper: () => ({
      next: jest.fn(),
    }),
  }),
);

// Add mock for useCapacityUnit hook
jest.mock('../../hooks/useCapacityUnit', () => ({
  useCapacityUnit: jest.fn(() => ({
    capacityUnit: 'GB',
    setCapacityUnit: jest.fn(),
    capacity: '1',
    setCapacity: jest.fn(),
    prettyCapacity: '1 GB',
  })),
  getCapacityBytes: jest.fn(() => 1073741824), // 1GB in bytes
}));
const selectors = {
  formTitle: () => screen.getByText('Configure ARTESCA for your Use case'),
  createAccountRadio: () => screen.getByText(/Create a new Account/i),
  useExistingAccountRadio: () => screen.getByText(/Use an existing Account/i),
  skipButton: () => screen.getByText(/Skip Use case configuration/i),
  continueButton: () => screen.getByText('Continue'),
  useExistingAccountSelect: () =>
    screen.getByRole('listbox', { name: /Select existing account/i }),
  existingUserRadio: () =>
    screen.getByRole('radio', { name: /Use an existing IAM User/i }),
  createUserRadio: () =>
    screen.getByRole('radio', { name: /Create a new IAM User/i }),
  createUserInput: () =>
    screen.getByRole('textbox', { name: /IAM User Name */i }),
  selectExistingUser: () =>
    screen.getByRole('listbox', { name: 'Select existing user' }),
  generateKey: () =>
    screen.getByRole('checkbox', { name: /Generate a new set of AK\/SK/ }),
};
describe('ISVConfiguration', () => {
  const mockSetConfig = jest.fn();
  const mockAccounts = {
    status: 'success',
    value: [
      {
        id: '1',
        name: 'test-account',
        preferredAssumableRoleArn: 'test-arn',
      },
      {
        id: '2',
        name: 'scality-internal-services',
        preferredAssumableRoleArn: 'internal-arn',
      },
    ],
  };

  const renderComponent = (platform = Veeam) => {
    return render(
      <Wrapper>
        <ISVStepperContext.Provider
          value={{
            platform,
          }}
        >
          <ISVConfiguration />
        </ISVStepperContext.Provider>
      </Wrapper>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    (useListAccounts as jest.Mock).mockReturnValue({ accounts: mockAccounts });
  });

  describe('Basic Rendering', () => {
    it('should render form with basic fields', () => {
      renderComponent();

      // Check form title
      expect(
        screen.getByText('Configure ARTESCA for your Use case'),
      ).toBeInTheDocument();

      // Check basic form fields
      expect(screen.getByText('Create a new Account')).toBeInTheDocument();
      expect(screen.getByText('Use an existing Account')).toBeInTheDocument();
      expect(
        screen.getByText(/Skip Use case configuration/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('Account Field', () => {
    it('should show account name input for new account', async () => {
      renderComponent();

      const createNewRadio = screen.getByText('Create a new Account');
      await userEvent.click(createNewRadio);

      expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
    });

    it('should show account select for existing account', async () => {
      renderComponent();

      const useExistingRadio = screen.getByText('Use an existing Account');
      await userEvent.click(useExistingRadio);

      expect(screen.getByText('Select existing account')).toBeInTheDocument();

      // Should not show internal account in options
      await userEvent.click(screen.getByText('Select existing account'));
      expect(screen.getByText('test-account')).toBeInTheDocument();
      expect(
        screen.queryByText('scality-internal-services'),
      ).not.toBeInTheDocument();
    });

    it('should disable account selection when no accounts are available', async () => {
      (useListAccounts as jest.Mock).mockReturnValue({ accounts: [] });

      renderComponent();
      const useExistingRadio = screen.getByLabelText(/Use an existing Account/);
      expect(useExistingRadio).toBeDisabled();
    });
    it.skip('should select correct account when account is in query params and disable create a new account choice', async () => {
      renderWithCustomRoute(
        <ISVStepperContext.Provider
          value={{
            platform: Veeam,
          }}
        >
          <ISVConfiguration />
        </ISVStepperContext.Provider>,
        '/isv/configuration?platform=veeam&account=test-account',
      );
      await waitFor(() => {
        expect(screen.getByText('test-account')).toBeInTheDocument();
      });
      expect(screen.getByLabelText('Create a new Account')).toBeDisabled();
    });
    it.skip('should not disable create account if account in query params does not exist', async () => {
      renderWithCustomRoute(
        <ISVStepperContext.Provider
          value={{
            platform: Veeam,
          }}
        >
          <ISVConfiguration />
        </ISVStepperContext.Provider>,
        '/isv/configuration?platform=veeam&account=non-existing-account',
      );
      expect(screen.getByLabelText('Create a new Account')).not.toBeDisabled();
      expect(
        screen.queryByText('non-existing-account'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Platform Specific Features', () => {
    describe.skip('Veeam', () => {
      it('should render correct config for Veeam', () => {
        renderComponent(Veeam);

        expect(screen.queryByText('Veeam application')).not.toBeInTheDocument();
        // Add checks for Veeam specific fields, labels, etc.
      });
    });
    describe.skip('Commvault', () => {
      it('should render correct config for Commvault', () => {
        renderComponent(Commvault);

        expect(screen.queryByText('Veeam application')).not.toBeInTheDocument();
        // Add checks for Commvault specific fields, labels, etc.
      });
    });
    describe.skip('Veeam VBO', () => {
      it('should render correct config for Veeam VBO', async () => {
        renderComponent(VeeamVBO);

        waitFor(() => {
          expect(screen.getByText('Veeam application')).toBeInTheDocument();
        });
        // Check for Veeam application label
        expect(screen.getByText('Veeam application')).toBeInTheDocument();

        // Open the dropdown
        const applicationInput = screen.getByRole('textbox', {
          name: 'Veeam application',
        });
        await userEvent.click(applicationInput);

        // Check for options in the dropdown
        const v6Options = screen.getAllByText(
          (text) =>
            text.includes('Veeam Backup for Microsoft 365') &&
            text.includes('v6'),
        );
        expect(v6Options.length).toBeGreaterThan(0);

        const v8Options = screen.getAllByText(
          (text) =>
            text.includes('Veeam Backup for Microsoft 365') &&
            text.includes('v8'),
        );
        expect(v8Options.length).toBeGreaterThan(0);
      });
      it('should show immutable backup toggle for VBO v8+', async () => {
        renderComponent(VeeamVBO);

        // Open the dropdown
        const applicationInput = screen.getByRole('textbox', {
          name: 'Veeam application',
        });
        await userEvent.click(applicationInput);

        // Select v8+ application using flexible text matching
        const v8Option = screen.getByText(
          (text) =>
            text.includes('Veeam Backup for Microsoft 365') &&
            text.includes('v8'),
        );
        await userEvent.click(v8Option);

        expect(screen.getByText('Immutable Backup')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable continue button when form is invalid', async () => {
      renderComponent(VeeamVBO);

      const continueButton = screen.getByRole('button', {
        name: /Arrow-right Continue/i,
      });
      expect(continueButton).toBeDisabled();

      // Fill in account name
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Account * Account Name *' }),
        'new-test-account',
      );

      // Set number of buckets to 1
      await userEvent.clear(
        screen.getByRole('spinbutton', { name: 'Number of buckets *' }),
      );
      await userEvent.type(
        screen.getByRole('spinbutton', { name: 'Number of buckets *' }),
        '1',
      );

      // Fill in bucket name
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Bucket #1 name *' }),
        'test-bucket',
      );

      // Fill in Veeam application for VBO
      const applicationInput = screen.getByRole('textbox', {
        name: 'Veeam application',
      });
      await userEvent.click(applicationInput);
      await userEvent.click(
        screen.getByRole('option', { name: VEEAM_OFFICE_365 }),
      );

      // Wait for validation to complete and form to be valid
      await waitFor(() => {
        expect(continueButton).toBeDisabled();
      });
    });
    it('should show error for duplicate account names', async () => {
      renderComponent();

      await userEvent.type(
        screen.getByLabelText(/Account Name/i),
        'test-account',
      );

      expect(
        screen.getByText('Account name already exists'),
      ).toBeInTheDocument();
    });
    // TODO
    it('should show error for duplicate IAM User Names', async () => {});
    it('should show error for duplicate bucket names', async () => {
      renderComponent();

      // Fill in bucket name
      await userEvent.clear(
        screen.getByRole('textbox', { name: 'Bucket name *' }),
      );
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Bucket name *' }),
        'test-bucket-1',
      );

      // Add buckets
      const bucketNumberInput = screen.getByRole('spinbutton', {
        name: 'Number of buckets *',
      });

      await userEvent.type(bucketNumberInput, '2');

      expect(bucketNumberInput).toHaveValue();

      waitFor(() => {
        expect(screen.getByText('Bucket #2 name *')).toBeInTheDocument();
      });

      // Fill in second bucket name
      await userEvent.clear(
        screen.getByRole('textbox', { name: 'Bucket #2 name *' }),
      );
      await userEvent.type(
        screen.getByRole('textbox', { name: 'Bucket #2 name *' }),
        'test-bucket-1',
      );

      expect(
        screen.getByText('Bucket name must be unique'),
      ).toBeInTheDocument();
    });
  });

  describe.only('Advanced Settings', () => {
    it('should show IAM user management section when using existing account', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));

      // Open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Verify IAM user section is present with its options
      expect(screen.getByText(/IAM User Management/i)).toBeInTheDocument();
      expect(screen.getByText('Create a new IAM User')).toBeInTheDocument();
      expect(screen.getByText('Use an existing IAM User')).toBeInTheDocument();
    });

    it('should hide advanced settings section for new account', () => {
      renderComponent();

      // Select create new account
      userEvent.click(screen.getByText('Create a new Account'));

      // Advanced settings should not be present
      expect(screen.queryByText('Advanced settings')).not.toBeInTheDocument();
    });

    it('should handle IAM user type selection in advanced settings', async () => {
      renderComponent();

      // Setup existing account view
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));
      await userEvent.click(screen.getByText('Advanced settings'));

      // Test switching between IAM user types
      waitFor(() => {
        expect(screen.getByText('Create a new IAM User')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Create a new IAM User'));
      expect(screen.getByLabelText('Create a new IAM User')).toBeChecked();
      expect(
        screen.queryByRole('textbox', { name: /IAM User/i }),
      ).toBeVisible();

      await userEvent.click(screen.getByText('Use an existing IAM User'));
      expect(screen.getByLabelText('Use an existing IAM User')).toBeChecked();
      expect(
        screen.queryByRole('listbox', { name: /Select existing user/ }),
      ).toBeVisible();
    });

    it('should show generate key checkbox for existing IAM user', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));

      // Open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Select existing IAM user
      await userEvent.click(screen.getByText('Use an existing IAM User'));

      expect(
        screen.getByText('Generate a new set of AK/SK'),
      ).toBeInTheDocument();
    });
    it('should not check by default generate key checkbox for existing IAM user with active keys', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));

      // Open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Select existing IAM user
      await userEvent.click(screen.getByText('Use an existing IAM User'));
      await userEvent.click(
        screen.queryByRole('listbox', { name: /Select existing user/ }),
      );
      await userEvent.click(screen.getByText('test-user'));

      expect(
        screen.getByText('Generate a new set of AK/SK'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Generate a new set of AK/SK'),
      ).not.toBeChecked();
    });

    it.only('should disable and check generate key checkbox for existing IAM user with no active keys', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));

      // Open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Select existing IAM user
      await userEvent.click(screen.getByText('Use an existing IAM User'));
      await userEvent.click(
        screen.queryByRole('listbox', { name: /Select existing user/ }),
      );
      await userEvent.click(screen.getByText('test-user'));

      expect(
        screen.getByText('Generate a new set of AK/SK'),
      ).toBeInTheDocument();
      debug();

      await waitFor(
        () => {
          expect(
            screen.getByLabelText(/Generate a new set of AK\/SK/),
          ).toBeChecked();
        },
        { timeout: 10000 },
      );

      expect(
        screen.getByLabelText('Generate a new set of AK/SK'),
      ).toBeDisabled();
    });

    //TODO
    it('should select create new IAM User if IAM User does not exist and prefill it with account name', async () => {
      renderComponent();
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));
      await userEvent.click(screen.getByText('Advanced settings'));
      waitFor(() => {
        expect(selectors.createUserRadio()).toBeChecked();
        expect(selectors.existingUserRadio()).not.toBeChecked();
        expect(selectors.createUserInput()).toHaveValue('test-account');
      });
    });

    it('should select IAM User corresponding to account name if it exist', async () => {
      renderComponent();
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));

      await userEvent.click(screen.getByText('Advanced settings'));
      waitFor(() => {
        expect(screen.getByText(/IAM User Management /)).toBeVisible();
      });
      debug();
      expect(selectors.createUserRadio()).not.toBeChecked();
      expect(selectors.existingUserRadio()).toBeChecked();
      expect(selectors.selectExistingUser()).toHaveValue('test-account');
    });
    it('should open and focus select user if selecting account with no user corresponding to account name', async () => {
      renderComponent();
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(screen.getByText('Select existing account'));
      await userEvent.click(screen.getByText('test-account'));

      waitFor(() => {
        expect(screen.getByText('Select existing user')).toBeInTheDocument();
        expect(screen.getByText('Select existing user')).toHaveFocus();
      });
    });
  });

  describe('Form Submission', () => {
    it.skip('should call setConfig with correct data on submit', async () => {
      renderComponent(Commvault);

      // Fill in account name
      await userEvent.click(screen.getByText('Create a new account'));
      const accountNameInput = screen.getByRole('textbox', {
        name: /Account Name/i,
      });
      await userEvent.clear(accountNameInput);
      await userEvent.type(accountNameInput, 'new-test-account');

      // Fill in bucket name
      const bucketNameInput = screen.getByRole('textbox', {
        name: /Bucket name * /i,
      });
      await userEvent.clear(bucketNameInput);
      await userEvent.type(bucketNameInput, 'test-bucket-1');

      // Wait for form validation to complete
      const submitButton = screen.getByRole('button', {
        name: /Continue/i,
      });

      // Make sure the button is enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Submit the form
      await userEvent.click(submitButton);

      // Verify setConfig was called with correct data
      await waitFor(() => {
        expect(mockSetConfig).toHaveBeenCalledWith({
          accountName: 'new-test-account',
          accountNameType: 'create',
          buckets: [
            {
              name: 'test-bucket-1',
              tag: 'commvault',
              capacity: '0',
              capacityUnit: '1099511627776',
            },
          ],
          enableImmutableBackup: true,
        });
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockNavigate.mockReset();
    });

    it('should show skip modal when clicking Skip button', async () => {
      renderComponent();

      // Click the skip button
      await userEvent.click(screen.getByText('Skip Use case configuration'));

      // Verify modal is shown
      expect(screen.getByText('Exit Veeam assistant?')).toBeInTheDocument();
    });

    it('should navigate to accounts page when confirming skip', async () => {
      renderComponent();

      // Click the skip button
      await userEvent.click(screen.getByText('Skip Use case configuration'));

      // Click the "Exit" button in the modal
      await userEvent.click(
        screen.getByRole('button', { name: 'Exit configuration' }),
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/accounts');
      });
    });

    it('should close modal without navigating when canceling skip', async () => {
      renderComponent();

      // Click the skip button
      await userEvent.click(screen.getByText('Skip Use case configuration'));

      // Click the "Cancel" button in the modal
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // Verify modal is closed (by checking it's no longer in the document)
      expect(
        screen.queryByText('Exit Veeam assistant?'),
      ).not.toBeInTheDocument();

      // Verify navigation was NOT called
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
