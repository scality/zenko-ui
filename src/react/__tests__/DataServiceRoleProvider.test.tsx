import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from '../../QueryClientProvider';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { coreUIAvailableThemes } from '@scality/core-ui/dist/style/theme';
import * as hooks from '../utils/hooks';
import STSClient from '../../js/STSClient';

const TEST_ROLE_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-manager-role';

const MOCK_STS_CREDENTIALS = {
  Credentials: {
    AccessKeyId: 'ASIA_TEST_ACCESS_KEY',
    SecretAccessKey: 'test-secret-key',
    SessionToken: 'test-session-token',
    Expiration: new Date(Date.now() + 3600 * 1000),
  },
};

const mockAssumeRoleWithWebIdentity = jest.fn().mockResolvedValue(MOCK_STS_CREDENTIALS);

// Mock STSClient prototype method since the module is already cached
// from the global setup and jest.mock won't rebind existing imports.
jest
  .spyOn(STSClient.prototype, 'assumeRoleWithWebIdentity')
  .mockImplementation((...args) => mockAssumeRoleWithWebIdentity(...args));

jest.mock('../utils/localStorage', () => ({
  getRoleArnStored: jest.fn(() => ''),
  setRoleArnStored: jest.fn(),
}));

jest.mock('../utils', () => ({
  genClientEndpoint: jest.fn((endpoint: string) => endpoint),
  initializeAWSSigner: jest.fn(),
}));

jest.mock('../ISV/components/ISVSummary', () => ({
  DEFAULT_REGION: 'us-east-1',
}));

// Use jest.spyOn to replace useAccounts on the already-imported module.
// jest.mock('../utils/hooks') doesn't work because jestSetupAfterEnv.tsx
// transitively imports DataServiceRoleProvider, which imports hooks before
// our test-level mock can take effect.
jest.spyOn(hooks, 'useAccounts').mockReturnValue({
  accounts: [
    {
      Name: 'test-account',
      id: '000000000000',
      Roles: [
        {
          Name: 'storage-manager-role',
          Arn: TEST_ROLE_ARN,
        },
      ],
    },
  ],
} as any);

import DataServiceRoleProvider, { useDataServiceRole, useAssumedRole, useAssumeRoleQuery } from '../DataServiceRoleProvider';
import * as dataBrowserLibrary from '@scality/data-browser-library';

const theme = coreUIAvailableThemes.darkRebrand;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <MemoryRouter>{children}</MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };
}

describe('DataServiceRoleProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssumeRoleWithWebIdentity.mockResolvedValue(MOCK_STS_CREDENTIALS);
    jest.spyOn(hooks, 'useAccounts').mockReturnValue({
      accounts: [
        {
          Name: 'test-account',
          id: '000000000000',
          Roles: [
            {
              Name: 'storage-manager-role',
              Arn: TEST_ROLE_ARN,
            },
          ],
        },
      ],
    } as any);
  });

  it('renders children after AssumeRole succeeds', async () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <DataServiceRoleProvider>
          <div data-testid="child-content">Hello</div>
        </DataServiceRoleProvider>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        roleArn: TEST_ROLE_ARN,
      }),
    );
  });

  it('useDataServiceRole returns the correct roleArn', async () => {
    const Wrapper = createWrapper();

    function RoleConsumer() {
      const role = useDataServiceRole();
      return <div data-testid="role-arn">{role.roleArn}</div>;
    }

    render(
      <Wrapper>
        <DataServiceRoleProvider>
          <RoleConsumer />
        </DataServiceRoleProvider>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('role-arn')).toHaveTextContent(TEST_ROLE_ARN);
    });
  });

  it('useAssumedRole returns STS credentials after query completes', async () => {
    const Wrapper = createWrapper();

    function AssumedRoleConsumer() {
      const assumedRole = useAssumedRole();
      if (!assumedRole) return <div data-testid="loading">Loading</div>;
      return <div data-testid="access-key">{assumedRole.Credentials?.AccessKeyId}</div>;
    }

    render(
      <Wrapper>
        <DataServiceRoleProvider>
          <AssumedRoleConsumer />
        </DataServiceRoleProvider>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('access-key')).toHaveTextContent('ASIA_TEST_ACCESS_KEY');
    });
  });

  it('assumeRoleQuery is called on remount (refetchOnMount: true)', async () => {
    // First mount — STS is called once
    const Wrapper1 = createWrapper();
    const { unmount } = render(
      <Wrapper1>
        <DataServiceRoleProvider>
          <div data-testid="child-content">Hello</div>
        </DataServiceRoleProvider>
      </Wrapper1>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledTimes(1);
    unmount();

    // Second mount with a fresh QueryClient — STS must be called again
    jest.clearAllMocks();
    mockAssumeRoleWithWebIdentity.mockResolvedValue(MOCK_STS_CREDENTIALS);
    jest.spyOn(hooks, 'useAccounts').mockReturnValue({
      accounts: [
        {
          Name: 'test-account',
          id: '000000000000',
          Roles: [{ Name: 'storage-manager-role', Arn: TEST_ROLE_ARN }],
        },
      ],
    } as any);

    const Wrapper2 = createWrapper();
    render(
      <Wrapper2>
        <DataServiceRoleProvider>
          <div data-testid="child-content-2">Hello again</div>
        </DataServiceRoleProvider>
      </Wrapper2>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content-2')).toBeInTheDocument();
    });

    expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledTimes(1);
    expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ roleArn: TEST_ROLE_ARN }),
    );
  });

  it('credentialProvider throws when STS refresh fails', async () => {
    // Use near-expiry credentials so credentialProvider triggers a refresh
    const nearExpiryCredentials = {
      Credentials: {
        AccessKeyId: 'ASIA_NEAR_EXPIRY',
        SecretAccessKey: 'secret',
        SessionToken: 'session',
        Expiration: new Date(Date.now() + 60 * 1000), // expires in 1 min (within 2 min buffer)
      },
    };
    mockAssumeRoleWithWebIdentity.mockResolvedValue(nearExpiryCredentials);

    // The @scality/data-browser-library module is auto-mocked in jestSetupAfterEnv.tsx
    // via jest.mock('@scality/data-browser-library'). Because DataBrowserProvider is
    // exported as a named binding (not necessarily a jest.fn()), we use
    // Object.defineProperty to replace it with a jest.fn() that captures getS3Config.
    let capturedGetS3Config: (() => any) | null = null;
    const captureImpl = jest.fn(({ getS3Config, children }: any) => {
      capturedGetS3Config = getS3Config;
      return <>{children}</>;
    });
    Object.defineProperty(dataBrowserLibrary, 'DataBrowserProvider', {
      value: captureImpl,
      writable: true,
      configurable: true,
    });

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <DataServiceRoleProvider>
          <div data-testid="child-content">Hello</div>
        </DataServiceRoleProvider>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    expect(capturedGetS3Config).not.toBeNull();

    // Retrieve the credentialProvider from the captured s3Config
    const s3Config = capturedGetS3Config!();
    const credentialProvider = s3Config.credentials;

    // Now make STS fail on the next call
    const stsError = new Error('403 Forbidden');
    mockAssumeRoleWithWebIdentity.mockRejectedValue(stsError);

    // credentialProvider detects near-expiry and calls react-query's refetch().
    // The .then() handler checks result.isError and throws, which is caught
    // and re-thrown by .catch(). The error propagates to the caller.
    await expect(credentialProvider()).rejects.toThrow('403 Forbidden');

    expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledTimes(2);
  });

  it('useAssumeRoleQuery getQuery carries refetchInterval option', () => {
    const Wrapper = createWrapper();

    const { result } = renderHook(() => useAssumeRoleQuery(), { wrapper: Wrapper });

    const queryConfig = result.current.getQuery(TEST_ROLE_ARN);

    expect(queryConfig).toMatchObject({
      refetchOnMount: true,
      refetchInterval: expect.any(Number),
      enabled: true,
    });
    expect(queryConfig.refetchInterval).toBeGreaterThan(0);
  });
});
