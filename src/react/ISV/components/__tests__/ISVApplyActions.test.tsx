import { render, screen, fireEvent } from '@testing-library/react';
import ISVApplyActions from '../ISVApplyActions';
import { Wrapper } from '../../../utils/testUtil';
import { ISVPlatformConfig } from '../../types';

// Mock dependencies
jest.mock(
  '@scality/core-ui/dist/components/steppers/Stepper.component',
  () => ({
    useStepper: () => ({
      next: jest.fn(),
    }),
  }),
);

jest.mock('@scality/module-federation', () => ({
  useBasenameRelativeNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useMutationActions', () => ({
  useMutationActions: () => ({
    data: [
      {
        step: 'Step 1',
        action: 'Create bucket',
        status: 'success',
        retry: jest.fn(),
      },
      {
        step: 'Step 2',
        action: 'Add tags',
        status: 'success',
        retry: jest.fn(),
      },
    ],
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  }),
}));

jest.mock('../../hooks/useMultiMutation', () => ({
  useMultiMutation: () => ({
    mutations: {
      'createBucket-test-bucket': {
        status: 'success',
        key: 'createBucket-test-bucket',
      },
      'putBucketTagging-test-bucket': {
        status: 'success',
        key: 'putBucketTagging-test-bucket',
      },
    },
    handleMutationReady: jest.fn(),
    isAllMutationsReady: true,
  }),
}));

jest.mock('../../../next-architecture/domain/business/buckets', () => ({
  useCreateBucketByS3Client: () => ({
    mutate: jest.fn(),
    status: 'success',
  }),
}));

jest.mock('../../../../js/mutations', () => ({
  usePutBucketTaggingMutationByS3Client: () => ({
    mutate: jest.fn(),
    status: 'success',
  }),
  usePutObjectMutation: () => ({
    mutate: jest.fn(),
    status: 'success',
  }),
}));

// Mock components
jest.mock('@scality/core-ui', () => {
  const original = jest.requireActual('@scality/core-ui');
  return {
    ...original,
    Form: ({ children, rightActions, layout }) => (
      <div data-testid="form">
        {layout?.title && <div>{layout.title}</div>}
        {children}
        <div data-testid="form-actions">{rightActions}</div>
      </div>
    ),
    Icon: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>,
    Stack: ({ children }) => <div data-testid="stack">{children}</div>,
    Text: ({ children }) => <span>{children}</span>,
  };
});

jest.mock('@scality/core-ui/dist/next', () => ({
  Box: ({ children }) => <div data-testid="box">{children}</div>,
  Button: ({ label, onClick, disabled, type }) => (
    <button
      data-testid={`button-${label}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {label}
    </button>
  ),
}));

jest.mock('../../../ui-elements/Table', () => {
  const Table = ({ children }) => <table>{children}</table>;
  Table.Head = ({ children }) => <thead>{children}</thead>;
  Table.HeadRow = ({ children }) => <tr>{children}</tr>;
  Table.HeadCell = ({ children }) => <th>{children}</th>;
  Table.Body = ({ children }) => <tbody>{children}</tbody>;
  Table.Row = ({ children }) => <tr>{children}</tr>;
  Table.Cell = ({ children }) => <td>{children}</td>;
  return Table;
});

jest.mock('../ISVSkipModal', () => ({
  ISVSkipModal: () => <div data-testid="skip-modal"></div>,
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
      id: 'veeam',
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

  it('renders the form with correct title', () => {
    renderComponent();
    expect(screen.getByTestId('form')).toBeInTheDocument();
    expect(
      screen.getByText(`Configure ARTESCA for ${mockProps.platform.name}`),
    ).toBeInTheDocument();
  });

  it('renders the table with steps', () => {
    renderComponent();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Create bucket')).toBeInTheDocument();
    expect(screen.getByText('Add tags')).toBeInTheDocument();
    expect(screen.getAllByText('Success')).toHaveLength(2);
  });

  it('renders action buttons', () => {
    renderComponent();
    expect(screen.getByTestId('button-Continue')).toBeInTheDocument();
    expect(screen.getByTestId('button-Exit')).toBeInTheDocument();
  });

  it('enables Continue button when all steps are successful', () => {
    renderComponent();
    expect(screen.getByTestId('button-Continue')).not.toBeDisabled();
  });

  it('renders Veeam-specific components when platform is Veeam', () => {
    const veeamProps = {
      ...mockProps,
      platform: {
        ...mockProps.platform,
        id: 'veeam',
      },
    } as any;

    // Override the useMultiMutation mock for this specific test
    jest
      .spyOn(require('../../hooks/useMultiMutation'), 'useMultiMutation')
      .mockReturnValue({
        mutations: {
          'createBucket-test-bucket': {
            status: 'success',
            key: 'createBucket-test-bucket',
          },
          'putBucketTagging-test-bucket': {
            status: 'success',
            key: 'putBucketTagging-test-bucket',
          },
          'putVeeamFolder-test-bucket': {
            status: 'success',
            key: 'putVeeamFolder-test-bucket',
          },
          'putVeeamSystemXml-test-bucket': {
            status: 'success',
            key: 'putVeeamSystemXml-test-bucket',
          },
          'putVeeamCapacityXml-test-bucket': {
            status: 'success',
            key: 'putVeeamCapacityXml-test-bucket',
          },
        },
        handleMutationReady: jest.fn(),
        isAllMutationsReady: true,
      });

    renderComponent(veeamProps);

    // Reset the mock to its original implementation
    jest.restoreAllMocks();
  });

  it('shows error state when some steps fail', () => {
    // Override useMutationActions for this specific test
    jest
      .spyOn(require('../../hooks/useMutationActions'), 'useMutationActions')
      .mockReturnValue({
        data: [
          {
            step: 'Step 1',
            action: 'Create bucket',
            status: 'success',
            retry: jest.fn(),
          },
          {
            step: 'Step 2',
            action: 'Add tags',
            status: 'error',
            retry: jest.fn(),
          },
        ],
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key',
      });

    renderComponent();

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByTestId('button-Retry')).toBeInTheDocument();
    expect(screen.getByTestId('button-Exit')).not.toBeDisabled();
    expect(screen.getByTestId('button-Continue')).toBeDisabled();

    // Reset the mock to its original implementation
    jest.restoreAllMocks();
  });

  it('handles retry click', () => {
    const retryMock = jest.fn();

    // Override useMutationActions for this specific test
    jest
      .spyOn(require('../../hooks/useMutationActions'), 'useMutationActions')
      .mockReturnValue({
        data: [
          {
            step: 'Step 1',
            action: 'Create bucket',
            status: 'success',
            retry: jest.fn(),
          },
          {
            step: 'Step 2',
            action: 'Add tags',
            status: 'error',
            retry: retryMock,
          },
        ],
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key',
      });

    renderComponent();

    const retryButton = screen.getByTestId('button-Retry');
    fireEvent.click(retryButton);
    expect(retryMock).toHaveBeenCalled();

    // Reset the mock to its original implementation
    jest.restoreAllMocks();
  });
});
