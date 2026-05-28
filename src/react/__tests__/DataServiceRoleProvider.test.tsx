import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from '../../QueryClientProvider';
import { MemoryRouter, Route, Routes } from 'react-router';
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

import DataServiceRoleProvider, { useDataServiceRole, useAssumedRole, useAssumeRoleQuery, useCurrentAccount, _DataServiceRoleContext } from '../DataServiceRoleProvider';
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

  it('renders children once credentials are available', async () => {
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

  it('useAssumedRole returns credentials once they are available', async () => {
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

  it('refreshes credentials on remount when they have expired', async () => {
    // Use a shared QueryClient so the cache persists across mounts.
    // Between mounts we invalidate the cache to simulate credentials
    // becoming stale, then verify refetchOnMount triggers a new STS call.
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    function SharedWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <MemoryRouter>{children}</MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      );
    }

    // First mount — STS is called once
    const { unmount } = render(
      <SharedWrapper>
        <DataServiceRoleProvider>
          <div data-testid="child-content">Hello</div>
        </DataServiceRoleProvider>
      </SharedWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledTimes(1);
    unmount();

    // Mark cached queries as stale (simulates credentials aging past staleTime)
    queryClient.invalidateQueries(['assumeRole']);

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

    // Second mount — stale cache + refetchOnMount: 'always' triggers a new STS call
    render(
      <SharedWrapper>
        <DataServiceRoleProvider>
          <div data-testid="child-content-2">Hello again</div>
        </DataServiceRoleProvider>
      </SharedWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content-2')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledTimes(1);
    });
  });

  it('S3 credential requests fail fast after a refresh error instead of retrying on every call', async () => {
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

    // @scality/data-browser-library is auto-mocked in jestSetupAfterEnv.tsx.
    // DataBrowserProvider is a named export (not a jest.fn), so we swap it via
    // Object.defineProperty and restore it at the end to avoid bleeding into
    // later tests in this file.
    const originalDataBrowserProvider = dataBrowserLibrary.DataBrowserProvider;
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

    try {
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

      const s3Config = capturedGetS3Config!();
      const credentialProvider = s3Config.credentials;

      const stsError = new Error('403 Forbidden');
      mockAssumeRoleWithWebIdentity.mockRejectedValue(stsError);

      // credentialProvider detects near-expiry and calls react-query's refetch().
      // The .then() handler checks result.isError and throws, which is caught
      // and re-thrown by .catch(). The error propagates to the caller.
      await expect(credentialProvider()).rejects.toThrow('403 Forbidden');
      expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledTimes(2);

      // A second call inside the cooldown window must NOT hit STS again —
      // it fast-fails with the cached error.
      await expect(credentialProvider()).rejects.toThrow('403 Forbidden');
      expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(dataBrowserLibrary, 'DataBrowserProvider', {
        value: originalDataBrowserProvider,
        writable: true,
        configurable: true,
      });
    }
  });

  it('credentials are configured to auto-refresh before expiry', () => {
    const Wrapper = createWrapper();

    const { result } = renderHook(() => useAssumeRoleQuery(), { wrapper: Wrapper });

    const queryConfig = result.current.getQuery(TEST_ROLE_ARN);

    expect(queryConfig).toMatchObject({
      refetchOnMount: 'always',
      refetchInterval: expect.any(Number),
      enabled: true,
    });
    expect(queryConfig.refetchInterval).toBeGreaterThan(0);
  });

  it('blocks content from rendering when navigating directly to an account URL before accounts have loaded', async () => {
    // When navigating directly to an account URL, accounts may not have loaded yet.
    jest.spyOn(hooks, 'useAccounts').mockReturnValue({
      accounts: [],
    } as any);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/accounts/my-account/details']}>
            <Routes>
              <Route
                path="/accounts/:accountName/details"
                element={
                  <DataServiceRoleProvider>
                    <div data-testid="child-content">Children</div>
                  </DataServiceRoleProvider>
                }
              />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe('useCurrentAccount', () => {
  const TEST_ACCOUNT = {
    Name: 'test-account',
    id: '000000000000',
    Roles: [{ Name: 'storage-manager-role', Arn: TEST_ROLE_ARN }],
  };

  const OTHER_ACCOUNT = {
    Name: 'other-account',
    id: '111111111111',
    Roles: [{ Name: 'storage-manager-role', Arn: 'arn:aws:iam::111111111111:role/scality-internal/storage-manager-role' }],
  };

  function createCurrentAccountWrapper({
    roleArn,
    accountNameInUrl,
  }: {
    roleArn: string;
    accountNameInUrl?: string;
  }) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const initialEntry = accountNameInUrl ? `/accounts/${accountNameInUrl}/details` : '/';
    const routePath = accountNameInUrl ? '/accounts/:accountName/details' : '/';

    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <MemoryRouter initialEntries={[initialEntry]}>
              <_DataServiceRoleContext.Provider
                value={{
                  role: { roleArn },
                  setRole: jest.fn(),
                  setRolePromise: jest.fn() as any,
                  assumedRole: undefined,
                }}
              >
                <Routes>
                  <Route path={routePath} element={<>{children}</>} />
                </Routes>
              </_DataServiceRoleContext.Provider>
            </MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    jest.spyOn(hooks, 'useAccounts').mockReturnValue({
      accounts: [TEST_ACCOUNT, OTHER_ACCOUNT],
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the roleArn-derived account when both roleArn and URL accountName are present', () => {
    const Wrapper = createCurrentAccountWrapper({
      roleArn: TEST_ROLE_ARN,
      accountNameInUrl: 'other-account',
    });

    const { result } = renderHook(() => useCurrentAccount(), { wrapper: Wrapper });

    expect(result.current.account).toBeDefined();
    expect(result.current.account?.id).toBe('000000000000');
    expect(result.current.account?.Name).toBe('test-account');
  });

  it('falls back to URL accountName when roleArn is absent', () => {
    const Wrapper = createCurrentAccountWrapper({
      roleArn: '',
      accountNameInUrl: 'other-account',
    });

    const { result } = renderHook(() => useCurrentAccount(), { wrapper: Wrapper });

    expect(result.current.account).toBeDefined();
    expect(result.current.account?.id).toBe('111111111111');
    expect(result.current.account?.Name).toBe('other-account');
  });

  it('returns undefined when neither roleArn nor URL accountName is present', () => {
    jest.spyOn(hooks, 'useAccounts').mockReturnValue({
      accounts: [],
    } as any);

    const Wrapper = createCurrentAccountWrapper({
      roleArn: '',
    });

    const { result } = renderHook(() => useCurrentAccount(), { wrapper: Wrapper });

    expect(result.current.account).toBeUndefined();
  });
});
