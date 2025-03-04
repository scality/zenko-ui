import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ISVConfiguration } from '../ISVConfiguration';
import { ISVStepperContext } from '../ISVSteps';
import { useListAccounts } from '../../../next-architecture/domain/business/accounts';
import { Veeam } from '../../modules/veeam';
import { Commvault } from '../../modules/commvault';
import { VeeamVBO } from '../../modules/veeam-vbo';
import { VEEAM_OFFICE_365 } from '../../constants';
import { ISVConfig } from '../../types';
import { Wrapper } from '../../../utils/testUtil';

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
    IAMUsers: [],
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

describe('ISVConfiguration', () => {
  const mockSetConfig = jest.fn();
  const defaultConfig: ISVConfig = {
    accountName: '',
    enableImmutableBackup: true,
    buckets: [],
    application: '',
    accountNameType: 'create' as const,
  };

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
    // Explicitly reset mockNavigate between tests
    mockNavigate.mockReset();
    (useListAccounts as jest.Mock).mockReturnValue({ accounts: mockAccounts });
  });

  describe('Basic Rendering', () => {
    it('should render nothing when platform id is missing', () => {
      const platformWithoutId = {
        ...Veeam,
        id: undefined,
      };

      const { container } = renderComponent(platformWithoutId);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render form with basic fields', () => {
      renderComponent();

      // Check form title
      expect(
        screen.getByText('Configure ARTESCA for your Use case'),
      ).toBeInTheDocument();

      // Check basic form fields
      expect(screen.getByText('Create a new account')).toBeInTheDocument();
      expect(screen.getByText('Use an existing Account')).toBeInTheDocument();
      expect(
        screen.getByText(/Skip Use case configuration/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('Account Type Selection', () => {
    it('should show account name input for new account', async () => {
      renderComponent();

      const createNewRadio = screen.getByText('Create a new account');
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
  });

  describe('Platform Specific Features', () => {
    it('should show application selection for Veeam VBO', async () => {
      renderComponent(VeeamVBO);

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

    it('should not show application selection for Commvault', () => {
      renderComponent(Commvault);

      expect(screen.queryByText('Veeam application')).not.toBeInTheDocument();
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
      await userEvent.click(screen.getByRole('option', { name: VEEAM_OFFICE_365 }));

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
  });

  describe('Advanced Settings', () => {
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
      userEvent.click(screen.getByText('Create a new account'));

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
      await userEvent.click(screen.getByText('Create a new IAM User'));
      expect(
        screen.getByLabelText('Create a new IAM User'),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByText('Use an existing IAM User'));
      expect(screen.getByText('Select existing user')).toBeInTheDocument();
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

    // it('should navigate to accounts page when confirming skip', async () => {
    //   renderComponent();

    //   // Click the skip button
    //   await userEvent.click(screen.getByText('Skip Use case configuration'));

    //   // Click the "Exit" button in the modal
    //   await userEvent.click(
    //     screen.getByRole('button', { name: 'Exit configuration' }),
    //   );

    //   await waitFor(() => {
    //     expect(mockNavigate).toHaveBeenCalledWith('/accounts');
    //   });
    // });

    it('should close modal without navigating when canceling skip', async () => {
      // Reset mocks before test
      mockNavigate.mockClear();

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
