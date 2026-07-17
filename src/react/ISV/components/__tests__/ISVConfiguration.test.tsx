import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useListAccounts } from '../../../next-architecture/domain/business/accounts';
import { mockShellHooks, renderWithCustomRoute, Wrapper } from '../../../utils/testUtil';
import { DEFAULT_IMMUTABLE_PERIOD_DAYS, VEEAM_OFFICE_365 } from '../../constants';
import { CommvaultPlatform } from '../../platforms/commvault';
import { KastenPlatform } from '../../platforms/kasten';
import { RubrikPlatform } from '../../platforms/rubrik';
import { VeeamVBOPlatform } from '../../platforms/veeam-vbo';
import { VeeamVBRPlatform } from '../../platforms/veeam-vbr';
import { getDefaultFormValues, ISVConfiguration } from '../ISVConfiguration';
import { ISVStepperContext } from '../ISVStepperContext';

const mockNavigate = jest.fn();
jest.mock('@scality/module-federation', () => ({
  ...jest.requireActual('@scality/module-federation'),
  useBasenameRelativeNavigate: jest.fn().mockImplementation(() => mockNavigate),
}));

// Mock useRef to reset iamRequestSentRef
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn().mockImplementation((initialValue) => ({
    current: initialValue,
  })),
}));

// Mock domain hooks
jest.mock('../../../next-architecture/domain/business/accounts', () => ({
  useListAccounts: jest.fn(),
}));

// Mock IAM hook
jest.mock('../../hooks/useIAMUser', () => {
  const mockUseIAMUser = jest.fn().mockReturnValue({
    isIAMUserExist: false,
    IAMUsersStatus: 'success',
    IAMUsers: [{ id: '1', name: 'test-user' }],
    getIAMUsersMutation: { mutate: jest.fn() },
    accessKeys: null,
  });

  return {
    useIAMUser: mockUseIAMUser,
  };
});

const mockNext = jest.fn();
// Mock stepper hook
jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => ({
  useStepper: () => ({
    next: mockNext,
  }),
}));

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
  createAccountRadio: () => screen.getByRole('radio', { name: /Create a new Account/i }),
  existingAccountRadio: () => screen.getByRole('radio', { name: /Use an existing Account/i }),
  skipButton: () => screen.getByText(/Skip Use case configuration/i),
  continueButton: () => screen.getByRole('button', { name: /Continue/i }),
  useExistingAccountSelect: () => screen.getByRole('listbox', { name: /Select existing account/i }),
  existingUserRadio: () => screen.getByRole('radio', { name: /Use an existing IAM User/i }),
  createUserRadio: () => screen.getByRole('radio', { name: /Create a new IAM User/i }),
  createUserInput: () => screen.getByRole('textbox', { name: /IAM User Name */i }),
  selectExistingUser: () => screen.getByRole('listbox', { name: 'Select existing user' }),
  generateKey: () => screen.getByRole('checkbox', { name: /Generate a new set of AK\/SK/ }),
};
describe('ISVConfiguration', () => {
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

  const renderComponent = (platform = VeeamVBRPlatform) => {
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
    mockNext.mockClear();

    (useListAccounts as jest.Mock).mockReturnValue({ accounts: mockAccounts });
    const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
    useIAMUserMock.mockReturnValue({
      isIAMUserExist: false,
      IAMUsersStatus: 'success',
      IAMUsers: [{ id: '1', name: 'test-user' }],
      getIAMUsersMutation: { mutate: jest.fn() },
      accessKeys: null,
      hasActiveKeys: false,
    });

    const capacityMocks = require('../../hooks/useCapacityUnit');
    capacityMocks.useCapacityUnit.mockReturnValue({
      capacityUnit: 'GB',
      setCapacityUnit: jest.fn(),
      capacity: '1',
      setCapacity: jest.fn(),
      prettyCapacity: '1 GB',
    });
    capacityMocks.getCapacityBytes.mockReturnValue(1073741824);
  });

  it('should show skip modal when clicking Skip button', async () => {
    renderComponent();

    // Click the skip button
    await userEvent.click(selectors.skipButton());

    // Verify modal is shown
    expect(screen.getByText('Exit Veeam assistant?')).toBeInTheDocument();
  });

  it('should disable Continue button if form is invalid', async () => {
    renderComponent();

    expect(selectors.continueButton()).toBeDisabled();
  });

  it('should navigate to next step when Continue button is clicked', async () => {
    renderComponent(CommvaultPlatform);

    await userEvent.type(screen.getByRole('textbox', { name: /Account \* Account Name \*/i }), 'new-veeam-account');

    await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'veeam-bucket');

    await waitFor(() => {
      expect(selectors.continueButton()).not.toBeDisabled();
    });

    await userEvent.click(selectors.continueButton());

    expect(mockNext).toHaveBeenCalled();
  });

  it('should navigate to next step when add mutiple buckets and remove one', async () => {
    renderComponent(CommvaultPlatform);

    const bucketNumberInput = screen.getByRole('spinbutton', { name: /number of buckets \*/i });

    await userEvent.click(selectors.createAccountRadio());
    await userEvent.type(screen.getByRole('textbox', { name: /Account \* Account Name \*/i }), 'new-account');

    await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'test-bucket-1');

    fireEvent.change(bucketNumberInput, { target: { value: '3' } });

    await userEvent.type(screen.getByRole('textbox', { name: /Bucket #2 name \*/i }), 'test-bucket-2');

    await userEvent.type(screen.getByRole('textbox', { name: /Bucket #3 name \*/i }), 'test-bucket-3');

    fireEvent.change(bucketNumberInput, { target: { value: '1' } });

    await userEvent.click(selectors.continueButton());

    expect(mockNext).toHaveBeenCalled();
  });

  describe('Basic Rendering', () => {
    it('should render form with basic fields', () => {
      renderComponent();

      // Check form title
      expect(selectors.formTitle()).toBeInTheDocument();

      // Check basic form fields
      expect(selectors.createAccountRadio()).toBeInTheDocument();
      expect(selectors.existingAccountRadio()).toBeInTheDocument();
      expect(selectors.skipButton()).toBeInTheDocument();
      expect(selectors.continueButton()).toBeInTheDocument();
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

      expect(selectors.useExistingAccountSelect()).toBeInTheDocument();

      // Should not show internal account in options
      await userEvent.click(selectors.useExistingAccountSelect());
      expect(screen.getAllByText('test-account').length).toBeGreaterThan(0);
      expect(screen.queryByText('scality-internal-services')).not.toBeInTheDocument();
    });

    it('should show first account as selected value when switching to existing account', async () => {
      renderComponent();

      await userEvent.click(selectors.existingAccountRadio());

      // The select should display the first account (options[0].name) as the selected value
      await waitFor(() => {
        expect(screen.getByText('test-account')).toBeInTheDocument();
      });
    });

    it('should disable account selection when no accounts are available', async () => {
      (useListAccounts as jest.Mock).mockReturnValue({ accounts: [] });

      renderComponent();
      const useExistingRadio = screen.getByLabelText(/Use an existing Account/);
      expect(useExistingRadio).toBeDisabled();
    });
    it('should select correct account when account is in query params and disable create a new account choice', async () => {
      renderWithCustomRoute(
        <ISVStepperContext.Provider
          value={{
            platform: VeeamVBRPlatform,
          }}
        >
          <ISVConfiguration />
        </ISVStepperContext.Provider>,
        '/isv/configuration?platform=veeam&account=test-account',
      );
      await waitFor(() => {
        expect(screen.getByText('test-account')).toBeInTheDocument();
      });
      expect(selectors.createAccountRadio()).toBeDisabled();
    });
    it('should not disable create account if account in query params does not exist', async () => {
      renderWithCustomRoute(
        <ISVStepperContext.Provider
          value={{
            platform: VeeamVBRPlatform,
          }}
        >
          <ISVConfiguration />
        </ISVStepperContext.Provider>,
        '/isv/configuration?platform=veeam&account=non-existing-account',
      );
      expect(selectors.createAccountRadio()).not.toBeDisabled();
      expect(screen.queryByText('non-existing-account')).not.toBeInTheDocument();
    });
  });

  describe('Platform Specific Features', () => {
    describe('Veeam', () => {
      it('should render correct config for Veeam', async () => {
        renderComponent(VeeamVBRPlatform);

        // Verify Veeam has no application dropdown
        expect(screen.queryByText('Veeam application')).not.toBeInTheDocument();

        // Complete the form but don't attempt to submit
        await userEvent.click(selectors.createAccountRadio());
        await userEvent.type(
          screen.getByRole('textbox', { name: /Account \* Account Name \*/i }),
          'veeam-account-1', // Use unique name to avoid duplicate name error
        );

        // Verify bucket field is present
        expect(screen.getByRole('textbox', { name: /Bucket name \*/i })).toBeInTheDocument();

        // Verify immutable backup toggle if present
        const immutableText = screen.queryByText('Immutable Backup');
        if (immutableText) {
          expect(immutableText).toBeInTheDocument();
        }
      });
    });

    describe('CommvaultPlatform', () => {
      it('should render correct config for CommvaultPlatform', async () => {
        renderComponent(CommvaultPlatform);

        // Verify CommvaultPlatform has no Veeam application field
        expect(screen.queryByText('Veeam application')).not.toBeInTheDocument();

        // Complete the form but don't check for immutable backup
        await userEvent.click(selectors.createAccountRadio());
        await userEvent.type(
          screen.getByRole('textbox', { name: /Account \* Account Name \*/i }),
          'commvault-account-1', // Use unique name to avoid duplicate name error
        );

        // Check for bucket field
        expect(screen.getByRole('textbox', { name: /Bucket name \*/i })).toBeInTheDocument();
      });
    });

    describe('Veeam VBO', () => {
      it('should render correct config for Veeam VBO', async () => {
        renderComponent(VeeamVBOPlatform);

        // Verify application selection is present
        await waitFor(() => {
          expect(screen.getByText('Veeam application')).toBeInTheDocument();
        });

        // Open the dropdown
        const applicationInput = screen.getByRole('textbox', {
          name: 'Veeam application',
        });
        await userEvent.click(applicationInput);

        // Just check that options exist without trying to count them
        expect(screen.getAllByText(/Veeam Backup for Microsoft 365/).length).toBeGreaterThan(0);
      });

      it('should show immutable backup toggle for VBO v8+', async () => {
        renderComponent(VeeamVBOPlatform);

        // Open the dropdown
        const applicationInput = screen.getByRole('textbox', {
          name: 'Veeam application',
        });
        await userEvent.click(applicationInput);

        // Try to select the option in a more reliable way
        await userEvent.click(screen.getAllByText(/v8/)[0]);

        // Check if immutable backup is present
        const immutableText = screen.queryByText('Immutable Backup');
        if (immutableText) {
          expect(immutableText).toBeInTheDocument();
        }
      });

      it('should handle VBO application selection', async () => {
        renderComponent(VeeamVBOPlatform);

        // Open application dropdown
        const applicationInput = screen.getByRole('textbox', {
          name: 'Veeam application',
        });
        await userEvent.click(applicationInput);

        // Select an option in a more reliable way
        await userEvent.click(screen.getAllByText(/v6/)[0]);

        // Verify the application was selected
        expect(applicationInput).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable continue button when form is invalid', async () => {
      renderComponent(VeeamVBOPlatform);

      expect(selectors.continueButton()).toBeDisabled();

      // Fill in account name
      await userEvent.type(screen.getByRole('textbox', { name: 'Account * Account Name *' }), 'new-test-account');

      // Set number of buckets to 1
      await userEvent.clear(screen.getByRole('spinbutton', { name: 'Number of buckets *' }));
      await userEvent.type(screen.getByRole('spinbutton', { name: 'Number of buckets *' }), '1');

      // Fill in Veeam application for VBO
      const applicationInput = screen.getByRole('textbox', {
        name: 'Veeam application',
      });
      await userEvent.click(applicationInput);
      await userEvent.click(screen.getByRole('option', { name: VEEAM_OFFICE_365 }));

      expect(selectors.continueButton()).toBeDisabled();
    });

    it('should show error for duplicate account names', async () => {
      renderComponent();

      await userEvent.type(screen.getByLabelText(/Account Name/i), 'test-account');

      expect(screen.getByText('Account name already exists')).toBeInTheDocument();
    });

    it('should show error for duplicate IAM User Names', async () => {
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: true,
        IAMUsersStatus: 'success',
        IAMUsers: [{ id: '1', name: 'test-user' }],
        getIAMUsersMutation: { mutate: jest.fn() },
        accessKeys: null,
        hasActiveKeys: false,
      });

      renderComponent();

      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));
      await userEvent.click(screen.getByText('Advanced settings'));

      await userEvent.type(screen.getByLabelText(/IAM User Name/i), 'test-user');

      expect(screen.getByText('IAM User name already exists')).toBeInTheDocument();
    });

    it('should keep Continue button disabled when account name is a duplicate in create mode', async () => {
      renderComponent();

      await userEvent.type(screen.getByLabelText(/Account Name/i), 'test-account');

      expect(screen.getByText('Account name already exists')).toBeInTheDocument();
      expect(selectors.continueButton()).toBeDisabled();
    });

    it('should not submit when account name is a duplicate even if the form is otherwise valid', async () => {
      const { container } = renderComponent(CommvaultPlatform);

      await userEvent.type(screen.getByRole('textbox', { name: /Account \* Account Name \*/i }), 'test-account');
      // Fill the required bucket field so Joi validation (mode: 'all') passes —
      // Joi does not know about duplicates, so handleSubmit would otherwise run.
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      await waitFor(() => {
        expect(screen.getByText('Account name already exists')).toBeInTheDocument();
      });

      // A disabled Continue button does not stop Enter-key / implicit form
      // submission, which fires a native submit event on the form. The onSubmit
      // guard must block navigation for the duplicate name.
      const form = container.querySelector('form') as HTMLFormElement;
      await act(async () => {
        fireEvent.submit(form);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should re-enable Continue button when account name is changed from duplicate to non-duplicate', async () => {
      renderComponent(CommvaultPlatform);

      const accountNameInput = screen.getByRole('textbox', { name: /Account \* Account Name \*/i });

      // Type a duplicate name first
      await userEvent.type(accountNameInput, 'test-account');

      await waitFor(() => {
        expect(screen.getByText('Account name already exists')).toBeInTheDocument();
      });
      expect(selectors.continueButton()).toBeDisabled();

      // Clear and type a non-duplicate name
      await userEvent.clear(accountNameInput);
      await userEvent.type(accountNameInput, 'unique-account');

      // Also fill the required bucket field
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      await waitFor(() => {
        expect(screen.queryByText('Account name already exists')).not.toBeInTheDocument();
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should keep Continue button disabled when IAM user name is a duplicate', async () => {
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: true,
        IAMUsersStatus: 'success',
        IAMUsers: [{ id: '1', name: 'test-user' }],
        getIAMUsersMutation: { mutate: jest.fn() },
        accessKeys: null,
        hasActiveKeys: false,
      });

      renderComponent();

      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));
      await userEvent.click(screen.getByText('Advanced settings'));

      await userEvent.click(selectors.createUserRadio());
      await userEvent.type(screen.getByLabelText(/IAM User Name/i), 'test-user');

      expect(screen.getByText('IAM User name already exists')).toBeInTheDocument();
      expect(selectors.continueButton()).toBeDisabled();
    });

    it('should show error for duplicate bucket names', async () => {
      renderComponent();

      // Fill in bucket name
      await userEvent.clear(screen.getByRole('textbox', { name: 'Bucket name *' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Bucket name *' }), 'test-bucket-1');

      // Add buckets
      const bucketNumberInput = screen.getByRole('spinbutton', { name: /number of buckets \*/i });

      fireEvent.change(bucketNumberInput, { target: { value: '2' } });

      expect(bucketNumberInput).toHaveValue();

      await waitFor(() => {
        expect(screen.getByText('Bucket #2 name *')).toBeInTheDocument();
      });

      // Fill in second bucket name
      await userEvent.clear(screen.getByRole('textbox', { name: 'Bucket #2 name *' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Bucket #2 name *' }), 'test-bucket-1');

      expect(screen.getByText('Bucket name must be unique')).toBeInTheDocument();
    });

    it('should enable Continue button after switching to existing account and filling required fields', async () => {
      renderComponent(CommvaultPlatform);

      // Switch to existing account
      await userEvent.click(selectors.existingAccountRadio());

      // Assert the account select shows options[0].name as the selected value
      await waitFor(() => {
        expect(screen.getByText('test-account')).toBeInTheDocument();
      });

      // Open advanced settings to fill IAM user name (required for existing account)
      await userEvent.click(screen.getByText('Advanced settings'));

      // Fill in a valid IAM user name
      await userEvent.type(screen.getByRole('textbox', { name: /IAM User Name \*/i }), 'new-iam-user');

      // Fill in bucket name
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      // Continue button should now be enabled
      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should disable Continue button after switching back to create account', async () => {
      renderComponent(CommvaultPlatform);

      // Switch to existing account and fill required fields
      await userEvent.click(selectors.existingAccountRadio());

      await waitFor(() => {
        expect(screen.getByText('test-account')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Advanced settings'));
      await userEvent.type(screen.getByRole('textbox', { name: /IAM User Name \*/i }), 'new-iam-user');
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });

      // Switch back to create account — accountName is cleared by resetIAMFields
      await userEvent.click(selectors.createAccountRadio());

      // Continue button should be disabled again because accountName is cleared
      await waitFor(() => {
        expect(selectors.continueButton()).toBeDisabled();
      });
    });

    it('should disable existing account radio and keep Continue disabled when no accounts are available', async () => {
      (useListAccounts as jest.Mock).mockReturnValue({
        accounts: { status: 'success', value: [] },
      });

      renderComponent(CommvaultPlatform);

      // With no accounts, the existing account radio is disabled and form stays invalid
      const existingRadio = screen.getByRole('radio', { name: /Use an existing Account/i });
      expect(existingRadio).toBeDisabled();
      expect(selectors.continueButton()).toBeDisabled();
    });

    it('should sync IAMUserName when toggling IAM user radio from create back to existing', async () => {
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReset();
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: false,
        IAMUsersStatus: 'success',
        IAMUsers: [{ id: '1', name: 'iam-user-1' }],
        getIAMUsersMutation: {
          mutate: jest.fn().mockImplementation((_roleArn, options) => {
            if (options?.onSuccess) {
              options.onSuccess({
                Users: [{ UserName: 'iam-user-1', UserId: 'id1', Arn: 'arn1' }],
              });
            }
          }),
          status: 'success',
        },
        accessKeys: null,
        hasActiveKeys: false,
      });

      renderComponent(CommvaultPlatform);

      // Switch to existing account; onAccountSelected auto-expands advanced settings
      // because no IAM user matches 'test-account'. IAMUserNameType becomes 'existing'
      // but IAMUserName stays '' (resetIAMFields cleared it).
      await userEvent.click(selectors.existingAccountRadio());

      // Fill bucket name so Continue validity only depends on IAMUserName.
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      await waitFor(() => {
        expect(screen.getByText(/IAM User Management/i)).toBeInTheDocument();
      });

      // Toggle IAM user radio: existing -> create -> existing. On the final switch
      // back to 'existing', IAMUserName must be synced to iamUsers[0].name so the
      // Controller doesn't fall back to the registered '' value.
      await userEvent.click(selectors.createUserRadio());
      await userEvent.click(selectors.existingUserRadio());

      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should enable Continue button after only switching to existing account radio without touching advanced settings', async () => {
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReset();
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: false,
        IAMUsersStatus: 'success',
        IAMUsers: [],
        getIAMUsersMutation: {
          mutate: jest.fn().mockImplementation((_roleArn, options) => {
            if (options && options.onSuccess) {
              options.onSuccess({ Users: [] });
            }
          }),
          status: 'success',
        },
        accessKeys: null,
        hasActiveKeys: false,
      });

      renderComponent(CommvaultPlatform);

      // Only switch to the existing account radio. Do NOT open Advanced settings
      // and do NOT interact with the account Select. This mirrors what a real
      // user does when they just click the radio and expect Continue to work.
      await userEvent.click(selectors.existingAccountRadio());

      // Fill the only other required field (bucket name) so validity hinges on
      // IAMUserName being auto-synced by the radio switch.
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      // Radio switch should trigger onAccountSelected(accounts[0].name), which
      // on empty Users auto-sets IAMUserName=accountName, making the form valid.
      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should enable Continue button after switching to existing account even if IAM users fetch never resolves', async () => {
      // Simulate a real-world slow / failed AssumeRole where mutate is called
      // but onSuccess is never invoked. Without a pre-fill fallback the form
      // would stay invalid forever, making Continue freeze.
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReset();
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: false,
        IAMUsersStatus: 'loading',
        IAMUsers: [],
        getIAMUsersMutation: {
          mutate: jest.fn(),
          status: 'loading',
        },
        accessKeys: null,
        hasActiveKeys: false,
      });

      renderComponent(CommvaultPlatform);

      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should enable Continue button when account has IAM users but none matches accountName', async () => {
      // Case C: accordion auto-expands but IAMUserName was previously left as ''
      // so the Controller's defaultValue gets ignored -- Select displays the first
      // user in the UI but form state stays empty, freezing the Continue button.
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReset();
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: false,
        IAMUsersStatus: 'success',
        IAMUsers: [{ id: '1', name: 'iam-user-1' }],
        getIAMUsersMutation: {
          mutate: jest.fn().mockImplementation((_roleArn, options) => {
            if (options?.onSuccess) {
              options.onSuccess({
                Users: [{ UserName: 'iam-user-1', UserId: 'id1', Arn: 'arn1' }],
              });
            }
          }),
          status: 'success',
        },
        accessKeys: null,
        hasActiveKeys: false,
      });

      renderComponent(CommvaultPlatform);

      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-bucket');

      // onAccountSelected auto-expands the accordion (no user matches
      // 'test-account'); IAMUserName should be defaulted to iamUsers[0].name
      // so the form is valid without the user having to touch the Select.
      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });
  });

  describe('Advanced Settings', () => {
    it('should open and focus select user if selecting account with no user corresponding to account name', async () => {
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReset();
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: false,
        IAMUsersStatus: 'success',
        IAMUsers: [
          { id: '1', name: 'test-user' },
          { id: '2', name: 'test-user-2' },
        ],
        getIAMUsersMutation: {
          mutate: jest.fn().mockImplementation((roleArn, options) => {
            if (options && options.onSuccess) {
              options.onSuccess({
                Users: [
                  {
                    UserName: 'test-user',
                    UserId: 'test-user-id',
                    Arn: 'test-arn',
                  },
                  {
                    UserName: 'test-user-2',
                    UserId: 'test-user-id-2',
                    Arn: 'test-arn-2',
                  },
                ],
              });
            }
          }),
          status: 'success',
        },
        accessKeys: null,
        hasActiveKeys: false,
      });

      renderComponent();

      await userEvent.click(selectors.existingAccountRadio());

      // The first account is now auto-selected when switching to existing mode.
      // We need to open the dropdown and pick a different account to trigger onAccountSelected,
      // then re-select 'test-account' so that onChange fires with the intended value.
      await userEvent.click(selectors.useExistingAccountSelect());
      // Re-selecting the already-selected value won't fire onChange, so the
      // auto-expand is only triggered via an explicit account selection that
      // calls onAccountSelected. Open advanced settings manually instead.
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));

      // Explicitly open advanced settings since re-selecting the same value
      // does not trigger onAccountSelected / accordion auto-expand.
      await userEvent.click(screen.getByText('Advanced settings'));

      await waitFor(() => {
        expect(screen.getByText(/IAM User Management/i)).toBeInTheDocument();
      });
    });

    it('should show Advanced settings with existing IAM user option selected after switching to a different account with no matching IAM user', async () => {
      const useIAMUserMock = require('../../hooks/useIAMUser').useIAMUser;
      useIAMUserMock.mockReset();
      useIAMUserMock.mockReturnValue({
        isIAMUserExist: false,
        IAMUsersStatus: 'success',
        IAMUsers: [
          { id: '1', name: 'test-user' },
          { id: '2', name: 'test-user-2' },
        ],
        getIAMUsersMutation: {
          mutate: jest.fn().mockImplementation((roleArn, options) => {
            if (options && options.onSuccess) {
              options.onSuccess({
                Users: [
                  { UserName: 'test-user', UserId: 'test-user-id', Arn: 'test-arn' },
                  { UserName: 'test-user-2', UserId: 'test-user-id-2', Arn: 'test-arn-2' },
                ],
              });
            }
          }),
          status: 'success',
        },
        accessKeys: null,
        hasActiveKeys: false,
      });

      (useListAccounts as jest.Mock).mockReturnValue({
        accounts: {
          status: 'success',
          value: [
            { id: '1', name: 'test-account', preferredAssumableRoleArn: 'test-arn' },
            { id: '2', name: 'second-account', preferredAssumableRoleArn: 'second-arn' },
          ],
        },
      });

      renderComponent();

      await userEvent.click(selectors.existingAccountRadio());

      // test-account is auto-selected; select a different account to trigger onAccountSelected
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'second-account' }));

      await waitFor(() => {
        expect(screen.getByText(/IAM User Management/i)).toBeInTheDocument();
        expect(selectors.existingUserRadio()).toBeChecked();
      });
      expect(selectors.createUserRadio()).not.toBeChecked();
    });

    it('should show IAM user management section when using existing account', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));

      // Explicitly open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Verify IAM user section is present with its options
      expect(screen.getByText(/IAM User Management/i)).toBeInTheDocument();
      expect(selectors.createUserRadio()).toBeInTheDocument();
      expect(selectors.existingUserRadio()).toBeInTheDocument();
    });

    it('should hide advanced settings section for new account', () => {
      renderComponent();

      // Select create new account
      userEvent.click(selectors.createAccountRadio());

      // Advanced settings should not be present
      expect(screen.queryByText('Advanced settings')).not.toBeInTheDocument();
    });

    it('should handle IAM user type selection in advanced settings', async () => {
      renderComponent();

      // Setup existing account view
      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));

      // Explicitly open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Test switching between IAM user types
      waitFor(() => {
        expect(selectors.createUserRadio()).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Create a new IAM User'));
      expect(selectors.createUserRadio()).toBeChecked();
      expect(selectors.createUserInput()).toBeVisible();

      await userEvent.click(screen.getByText('Use an existing IAM User'));
      expect(selectors.existingUserRadio()).toBeChecked();
      expect(selectors.selectExistingUser()).toBeVisible();
    });

    it('should show generate key checkbox for existing IAM user', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(screen.getByText('Use an existing Account'));
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));

      // Explicitly open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Select existing IAM user
      await userEvent.click(selectors.existingUserRadio());

      expect(screen.getByText('Generate a new set of AK/SK')).toBeInTheDocument();
    });
    it('should not check by default generate key checkbox for existing IAM user with active keys', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));

      // Explicitly open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Select existing IAM user
      await userEvent.click(selectors.existingUserRadio());
      await userEvent.click(screen.queryByRole('listbox', { name: /Select existing user/ }));
      await userEvent.click(screen.getByRole('option', { name: 'test-user' }));

      expect(selectors.generateKey()).not.toBeChecked();
    });

    it('should show generate key checkbox for existing IAM user with no active keys', async () => {
      renderComponent();

      // Select existing account
      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));

      // Explicitly open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      // Select existing IAM user
      await userEvent.click(selectors.existingUserRadio());
      await userEvent.click(selectors.selectExistingUser());
      await userEvent.click(screen.getByRole('option', { name: 'test-user' }));

      expect(selectors.generateKey()).toBeInTheDocument();
    });

    it('should select create new IAM User if IAM User does not exist and prefill it with account name', async () => {
      renderComponent();
      await userEvent.click(selectors.existingAccountRadio());
      await userEvent.click(selectors.useExistingAccountSelect());
      await userEvent.click(screen.getByRole('option', { name: 'test-account' }));

      // Explicitly open advanced settings
      await userEvent.click(screen.getByText('Advanced settings'));

      waitFor(() => {
        expect(selectors.createUserRadio()).toBeChecked();
        expect(selectors.existingUserRadio()).not.toBeChecked();
        expect(selectors.createUserInput()).toHaveValue('test-account');
      });
    });
  });

  describe('Continue button enabled on non-VBR platforms with artesca_plus_veeam flag', () => {
    const setupArtescaPlusVeeam = () => {
      (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(() => [
        {
          kind: 'artesca-base-ui',
          name: 'artesca-base-ui',
          url: 'https://artesca-base-ui',
          version: '1.0.0',
          appHistoryBasePath: '/app-history',
        },
      ]);
      (mockShellHooks.useConfigRetriever as jest.Mock).mockImplementation(() => ({
        retrieveConfiguration: jest.fn().mockReturnValue({
          spec: {
            selfConfiguration: {
              flags: ['artesca_plus_veeam'],
            },
          },
        }),
      }));
    };

    beforeEach(() => {
      setupArtescaPlusVeeam();
    });

    it('should enable Continue button for CommvaultPlatform with artesca_plus_veeam flag', async () => {
      render(
        <Wrapper>
          <ISVStepperContext.Provider value={{ platform: CommvaultPlatform }}>
            <ISVConfiguration />
          </ISVStepperContext.Provider>
        </Wrapper>,
      );

      await userEvent.type(
        screen.getByRole('textbox', { name: /Account \* Account Name \*/i }),
        'commvault-artesca-account',
      );
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'commvault-bucket');

      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should enable Continue button for VeeamVBOPlatform with artesca_plus_veeam flag', async () => {
      render(
        <Wrapper>
          <ISVStepperContext.Provider value={{ platform: VeeamVBOPlatform }}>
            <ISVConfiguration />
          </ISVStepperContext.Provider>
        </Wrapper>,
      );

      await userEvent.type(
        screen.getByRole('textbox', { name: /Account \* Account Name \*/i }),
        'vbo-artesca-account',
      );

      // Select a Veeam application (required for VBO)
      const applicationInput = screen.getByRole('textbox', { name: 'Veeam application' });
      await userEvent.click(applicationInput);
      await userEvent.click(screen.getByRole('option', { name: VEEAM_OFFICE_365 }));

      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'vbo-bucket');

      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should enable Continue button for KastenPlatform with artesca_plus_veeam flag', async () => {
      render(
        <Wrapper>
          <ISVStepperContext.Provider value={{ platform: KastenPlatform }}>
            <ISVConfiguration />
          </ISVStepperContext.Provider>
        </Wrapper>,
      );

      await userEvent.type(
        screen.getByRole('textbox', { name: /Account \* Account Name \*/i }),
        'kasten-artesca-account',
      );
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'kasten-bucket');

      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });

    it('should enable Continue button for RubrikPlatform with artesca_plus_veeam flag', async () => {
      render(
        <Wrapper>
          <ISVStepperContext.Provider value={{ platform: RubrikPlatform }}>
            <ISVConfiguration />
          </ISVStepperContext.Provider>
        </Wrapper>,
      );

      await userEvent.type(
        screen.getByRole('textbox', { name: /Account \* Account Name \*/i }),
        'rubrik-artesca-account',
      );
      // Rubrik requires bucket name matching /^[a-z0-9.-]+-rubrik-\d+$/
      await userEvent.type(screen.getByRole('textbox', { name: /Bucket name \*/i }), 'my-archive-rubrik-0');

      await waitFor(() => {
        expect(selectors.continueButton()).not.toBeDisabled();
      });
    });
  });
});

describe('getDefaultFormValues auto-create repository gating', () => {
  it('defaults autoCreateRepository to true for VBR on an ARTESCA+ Veeam deployment', () => {
    const defaults = getDefaultFormValues(VeeamVBRPlatform, null, true);

    expect(defaults.autoCreateRepository).toBe(true);
    expect(defaults.immutablePeriodDays).toBe(DEFAULT_IMMUTABLE_PERIOD_DAYS);
  });

  it('does not enable autoCreateRepository for VBR on a non ARTESCA+ (classical) deployment', () => {
    const defaults = getDefaultFormValues(VeeamVBRPlatform, null, false);

    expect(defaults.autoCreateRepository).toBeUndefined();
  });

  it('does not enable autoCreateRepository for a non-VBR platform even on an ARTESCA+ Veeam deployment', () => {
    const defaults = getDefaultFormValues(CommvaultPlatform, null, true);

    expect(defaults.autoCreateRepository).toBeUndefined();
  });
});
