import { render, screen, waitFor } from '@testing-library/react';
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

import DataServiceRoleProvider, { useDataServiceRole, useAssumedRole } from '../DataServiceRoleProvider';

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

  it('refetches credentials on mount even when cache is populated', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Pre-populate the cache to simulate a warm cache scenario
    queryClient.setQueryData(['assumeRole', TEST_ROLE_ARN], MOCK_STS_CREDENTIALS);

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <MemoryRouter>{children}</MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );

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

    // With refetchOnMount: true, a refetch should be triggered even though cache is populated
    expect(mockAssumeRoleWithWebIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        roleArn: TEST_ROLE_ARN,
      }),
    );
  });
});
