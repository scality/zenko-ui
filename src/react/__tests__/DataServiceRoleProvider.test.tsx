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

  it('assumeRoleQuery refetches on remount with stale cache', async () => {
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

  it('useAssumeRoleQuery getQuery carries refetchInterval option', () => {
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

  it('shows Loader and not children when accountName URL param is set but roleArn is still empty', async () => {
    // When accountName is present in the URL but accounts haven't loaded yet,
    // role.roleArn stays empty and the provider should render Loader instead of children.
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
