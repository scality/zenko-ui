import { render, screen, fireEvent } from '@testing-library/react';
import ISVApplyActions from '../ISVApplyActions';
import { Wrapper } from '../../../utils/testUtil';
import { ISVPlatformConfig } from '../../types';

// Mock for stepper context
jest.mock(
  '@scality/core-ui/dist/components/steppers/Stepper.component',
  () => ({
    useStepper: () => ({
      next: jest.fn(),
    }),
  }),
);

const mockMutationActions = {
  success: {
    data: [
      { step: 'Step 1', action: 'Create bucket', status: 'success' },
      { step: 'Step 2', action: 'Add tags', status: 'success' },
    ],
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  },
  error: {
    data: [
      { step: 'Step 1', action: 'Create bucket', status: 'success' },
      { step: 'Step 2', action: 'Add tags', status: 'error', retry: jest.fn() },
    ],
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  },
};

jest.mock('../../hooks/useMutationActions', () => ({
  useMutationActions: () => mockMutationActions.success,
}));

jest.mock('../../hooks/useMultiMutation', () => ({
  useMultiMutation: () => ({
    isAllMutationsReady: true,
    handleMutationReady: jest.fn(),
  }),
}));

// Mock for skip modal
jest.mock('../ISVSkipModal', () => ({
  ISVSkipModal: () => <div>Skip Modal</div>,
}));

describe('ISVApplyActions', () => {
  const mockProps = {
    buckets: [
      {
        name: 'test-bucket',
        disableVersioning: false,
        enableImmutableBackup: false,
        tag: 'test-tag',
      },
    ],
    enableImmutableBackup: false,
    accountName: 'test-account',
    application: 'Test App',
    platform: {
      id: 'veeam-vbr',
      name: 'Test Platform',
      logo: <div>Test Logo</div>,
      skipModalContent: <div>skip</div>,
      description: 'Test description',
      bucketTag: 'Test Tag',
    } as ISVPlatformConfig,
    account: null,
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  };

  const renderComponent = (props = mockProps) => {
    return render(
      <Wrapper>
        <ISVApplyActions {...props} />
      </Wrapper>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the configuration title correctly', () => {
    renderComponent();
    expect(
      screen.getByText(`Configure ARTESCA for ${mockProps.platform.name}`),
    ).toBeInTheDocument();
  });

  it('shows success state when all steps complete successfully', () => {
    jest
      .spyOn(require('../../hooks/useMutationActions'), 'useMutationActions')
      .mockReturnValue(mockMutationActions.success);

    renderComponent();

    expect(screen.getAllByText('Success')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled();
  });

  it('shows error state and retry option when a step fails', () => {
    const retryMock = jest.fn();
    const errorState = {
      ...mockMutationActions.error,
      data: [
        { step: 'Step 1', action: 'Create bucket', status: 'success' },
        {
          step: 'Step 2',
          action: 'Add tags',
          status: 'error',
          retry: retryMock,
        },
      ],
    };

    jest
      .spyOn(require('../../hooks/useMutationActions'), 'useMutationActions')
      .mockReturnValue(errorState);

    renderComponent();

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Redo Retry' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(retryMock).toHaveBeenCalled();
  });

  it('disables continue button when there are failures', () => {
    jest
      .spyOn(require('../../hooks/useMutationActions'), 'useMutationActions')
      .mockReturnValue(mockMutationActions.error);

    renderComponent();

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});
