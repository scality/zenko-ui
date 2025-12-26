import { render, screen, fireEvent } from '@testing-library/react';
import ISVApplyActions from '../ISVApplyActions';
import { Wrapper } from '../../../utils/testUtil';
import { ISVPlatformConfig } from '../../types';
import {
  useChainedMutations,
  ChainedMutationsResult,
} from '@scality/react-chained-query';

jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => ({
  useStepper: () => ({ next: jest.fn() }),
}));

jest.mock('@scality/react-chained-query');

jest.mock('../ISVSkipModal', () => ({
  ISVSkipModal: () => <div>Skip Modal</div>,
}));

jest.mock('../../../../js/mutations', () => ({
  useAttachPolicyToUserMutation: () => ({ mutate: jest.fn(), status: 'idle' }),
  useCreateAccountMutation: () => ({ mutate: jest.fn(), status: 'idle' }),
  useCreateIAMUserMutation: () => ({ mutate: jest.fn(), status: 'idle' }),
  useCreateUserAccessKeyMutation: () => ({ mutate: jest.fn(), status: 'idle' }),
  useCreateOrAddBucketToPolicyMutation: () => ({ mutate: jest.fn(), status: 'idle' }),
  useEnableSOSAPIMutation: () => ({ mutate: jest.fn(), status: 'idle' }),
  usePutBucketTaggingMutationByS3Client: () => ({ mutate: jest.fn(), status: 'idle' }),
  usePutObjectMutation: () => ({ mutate: jest.fn(), status: 'idle' }),
}));

jest.mock('../../../next-architecture/domain/business/buckets', () => ({
  useCreateBucketByS3Client: () => ({ mutate: jest.fn(), status: 'idle' }),
}));

jest.mock('../../../DataServiceRoleProvider', () => ({
  useSetAssumedRolePromise: () => jest.fn(),
}));

jest.mock('../../../next-architecture/domain/business/accounts', () => ({
  useAccountsLocationsAndEndpoints: () => ({
    refetchAccountsLocationsEndpointsMutation: { mutate: jest.fn(), status: 'idle' },
  }),
}));

jest.mock('../../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider', () => ({
  useAccountsLocationsEndpointsAdapter: () => ({}),
}));

jest.mock('../../../next-architecture/ui/AuthProvider', () => ({
  useInstanceId: () => 'test-instance-id',
}));

jest.mock('@scality/module-federation', () => ({
  useShellHooks: () => ({
    useAuth: () => ({ userData: { email: '@test.com' } }),
  }),
  useBasenameRelativeNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useCheckSOSAPIStatus', () => ({
  useCheckSOSAPIStatus: () => 'unavailable',
}));

const mockUseChainedMutations = useChainedMutations as jest.MockedFunction<typeof useChainedMutations>;

const mockRetry = jest.fn();

const mockGetResult = (id: string) => {
  if (id === 'createUserAccessKey') {
    return {
      AccessKey: {
        AccessKeyId: 'mock-access-key-id',
        SecretAccessKey: 'mock-secret-key',
      },
    };
  }
  return undefined;
};

const createMockChainedMutations = (
  overrides = {},
): ChainedMutationsResult => ({
  Slots: null,
  steps: [
    { id: 'step1', label: 'Create bucket', step: 1, status: 'success' as const, retry: mockRetry },
    { id: 'step2', label: 'Add tags', step: 2, status: 'success' as const, retry: mockRetry },
  ],
  isComplete: true,
  hasError: false,
  isReady: true,
  getResult: mockGetResult as ChainedMutationsResult['getResult'],
  start: jest.fn(),
  reset: jest.fn(),
  ...overrides,
});

describe('ISVApplyActions', () => {
  const mockProps = {
    buckets: [{ name: 'test-bucket', tag: 'test-tag' }],
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
      getPolicy: jest.fn(),
    } as unknown as ISVPlatformConfig,
    account: null,
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChainedMutations.mockReturnValue(createMockChainedMutations());
  });

  it('renders the configuration title correctly', () => {
    render(<Wrapper><ISVApplyActions {...mockProps} /></Wrapper>);
    expect(screen.getByText(`Configure ARTESCA for ${mockProps.platform.name}`)).toBeInTheDocument();
  });

  it('shows success state when all steps complete successfully', () => {
    render(<Wrapper><ISVApplyActions {...mockProps} /></Wrapper>);
    expect(screen.getAllByText('Success')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled();
  });

  it('shows error state and retry option when a step fails', () => {
    mockUseChainedMutations.mockReturnValue(createMockChainedMutations({
      steps: [
        { id: 'step1', label: 'Create bucket', step: 1, status: 'success', retry: mockRetry },
        { id: 'step2', label: 'Add tags', step: 2, status: 'error', retry: mockRetry },
      ],
      isComplete: false,
      hasError: true,
    }));

    render(<Wrapper><ISVApplyActions {...mockProps} /></Wrapper>);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Redo Retry' });
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('disables continue button when there are failures', () => {
    mockUseChainedMutations.mockReturnValue(createMockChainedMutations({
      isComplete: false,
      hasError: true,
    }));

    render(<Wrapper><ISVApplyActions {...mockProps} /></Wrapper>);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});
