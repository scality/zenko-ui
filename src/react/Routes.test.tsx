import { screen, waitFor } from '@testing-library/react';
import { useAuthLoading } from './AuthLoadingProvider';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import InternalRoutes, { PrivateRoutes } from './Routes';
import { FAKE_TOKEN, mockShellHooks, renderWithRouterMatch, TEST_ROLE_ARN } from './utils/testUtil';
import { setRoleArnStored, removeRoleArnStored } from './utils/localStorage';
import * as hooks from './utils/hooks';

jest.mock('./next-architecture/ui/ConfigProvider', () => ({
  useConfig: jest.fn(),
}));

jest.mock('./AuthLoadingProvider', () => ({
  useAuthLoading: jest.fn(),
}));
const defautOriginal = {
  id_token: 'idtoken',
  access_token: 'accessToken',
  profile: {
    sub: 'test-user-sub',
    instanceIds: ['1abe6d07-9b04-45e4-8c62-bdc5548f1f95'],
    name: 'Test User',
    email: 'test@test.com',
  },
  expires_at: Date.now() / 1000 + 3600,
  session_state: 'session-state-1',
};

describe('Routes component', () => {
  const mockUseConfig = useConfig as jest.Mock;
  const mockUseAuthLoading = useAuthLoading as jest.Mock;
  const selectors = {
    loadingAccounts: () => screen.queryByText(/Loading accounts/i),
    loadingDataServices: () => screen.queryByText(/Loading Data Services/i),
    createDataService: () => screen.queryByText(/Create new Data Service/i),
    loadingClients: () => screen.queryByText(/Loading clients/i),
    dataServicesLink: () => screen.queryByText(/Data Services/i),
    locationsLink: () => screen.queryByText(/Locations/i),
    truststoreLink: () => screen.queryByText(/Truststore/i),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for useAuthLoading - clients loaded
    mockUseAuthLoading.mockReturnValue({
      isConfigLoaded: true,
      isClientsLoaded: true,
      configFailure: false,
      configFailureErrorMessage: '',
    });
  });

  it('should show loading state when isClientsLoaded is false', async () => {
    // Override the default mock to set isClientsLoaded to false
    mockUseAuthLoading.mockReturnValue({
      isConfigLoaded: true,
      isClientsLoaded: false,
      configFailure: false,
      configFailureErrorMessage: '',
    });

    // Render the PrivateRoutes component
    renderWithRouterMatch(<PrivateRoutes />, {
      path: '/*',
      route: '/accounts',
    });

    // Verify that loading state is shown
    await waitFor(() => {
      expect(selectors.loadingClients()).toBeInTheDocument();
    });
  });

  it('should redirect incorrect routes to Accounts page', async () => {
    renderWithRouterMatch(<PrivateRoutes />, {
      path: '/*',
      route: '/incorrect-route',
    });

    await waitFor(() => {
      expect(selectors.loadingAccounts()).toBeInTheDocument();
    });
  });

  describe('sidebar entries', () => {
    it('should show Data Services and Locations from sidebar for Storage Manager', async () => {
      // Mock user Data Role to be Storage Manager

      // Render InternalRoutes with any route
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });

      // Check that Data Services link is not in the sidebar
      await waitFor(() => {
        expect(selectors.dataServicesLink()).toBeInTheDocument();
        expect(selectors.locationsLink()).toBeInTheDocument();
      });
    });

    it('should not show Data Services and Locations in sidebar for non Storage Manager', async () => {
      // Mock the hook to return false
      mockShellHooks.useAuth.mockReturnValue({
        userData: {
          token: FAKE_TOKEN,
          original: {
            id_token: 'idtoken',
            session_state: 'session-state-1',
            access_token: 'accessToken',
            profile: {
              sub: 'test-user-sub',
              instanceIds: ['1abe6d07-9b04-45e4-8c62-bdc5548f1f95'],
              name: 'Test User',
              email: 'test@test.com',
            },
            expires_at: Date.now() / 1000 + 3600,
          },
          groups: ['PlatformAdmin'],
        },
        getToken: () => Promise.resolve(FAKE_TOKEN),
      });
      // Render InternalRoutes with any route
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });

      // Check that Data Services link is in the sidebar
      await waitFor(() => {
        expect(selectors.dataServicesLink()).not.toBeInTheDocument();
        expect(selectors.locationsLink()).not.toBeInTheDocument();
      });
    });

    it('should show Truststore in sidebar for Platform Admin when MetalK8s is enabled', async () => {
      // Mock the hook to return PlatformAdmin user
      mockShellHooks.useAuth.mockReturnValue({
        userData: {
          token: FAKE_TOKEN,
          original: {
            id_token: 'idtoken',
            session_state: 'session-state-1',
            access_token: 'accessToken',
            profile: {
              sub: 'test-user-sub',
              instanceIds: ['1abe6d07-9b04-45e4-8c62-bdc5548f1f95'],
              name: 'Test User',
              email: 'test@test.com',
            },
            expires_at: Date.now() / 1000 + 3600,
          },
          groups: ['PlatformAdmin'],
        },
        getToken: () => Promise.resolve(FAKE_TOKEN),
      });

      // Mock MetalK8s as enabled
      (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(({ kind }: { kind: string }) => {
        if (kind === 'metalk8s-ui') {
          return [{ name: 'metalk8s-ui', kind: 'metalk8s-ui', version: '1.0', url: '', appHistoryBasePath: '' }];
        }
        return [{ kind: 'zenko-ui', name: 'zenko-ui.eu-west-1', version: '1.0', url: '', appHistoryBasePath: '' }];
      });

      mockUseConfig.mockReturnValue({
        basePath: '/data',
        features: [],
        zenkoEndpoint: '/zenko/s3',
        iamEndpoint: '/zenko/iam',
        stsEndpoint: '/zenko/sts',
        managementEndpoint: '/zenko/management',
        s3InternalFQDN: 's3.test.local',
        iamInternalFQDN: 'iam.test.local',
      });
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });

      await waitFor(() => {
        expect(selectors.truststoreLink()).toBeInTheDocument();
      });
    });

    it('should not show Truststore in sidebar for Platform Admin when MetalK8s is disabled', async () => {
      // Mock the hook to return PlatformAdmin user
      mockShellHooks.useAuth.mockReturnValue({
        userData: {
          token: FAKE_TOKEN,
          original: defautOriginal,
          groups: ['PlatformAdmin'],
        },
        getToken: () => Promise.resolve(FAKE_TOKEN),
      });

      // Mock MetalK8s as disabled (empty array)
      (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(({ kind }: { kind: string }) => {
        if (kind === 'metalk8s-ui') {
          return [];
        }
        return [{ kind: 'zenko-ui', name: 'zenko-ui.eu-west-1', version: '1.0', url: '', appHistoryBasePath: '' }];
      });

      mockUseConfig.mockReturnValue({
        basePath: '/data',
        features: [],
        zenkoEndpoint: '/zenko/s3',
        iamEndpoint: '/zenko/iam',
        stsEndpoint: '/zenko/sts',
        managementEndpoint: '/zenko/management',
        s3InternalFQDN: 's3.test.local',
        iamInternalFQDN: 'iam.test.local',
      });
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });

      await waitFor(() => {
        expect(selectors.truststoreLink()).not.toBeInTheDocument();
      });
    });

    it('should not show Truststore in sidebar for non Platform Admin even when MetalK8s is enabled', async () => {
      // Mock the hook to return non PlatformAdmin user
      mockShellHooks.useAuth.mockReturnValue({
        userData: {
          token: FAKE_TOKEN,
          original: {
            id_token: 'idtoken',
            session_state: 'session-state-1',
            access_token: 'accessToken',
            profile: {
              sub: 'test-user-sub',
              instanceIds: ['1abe6d07-9b04-45e4-8c62-bdc5548f1f95'],
              name: 'Test User',
              email: 'test@test.com',
            },
            expires_at: Date.now() / 1000 + 3600,
          },
          groups: ['StorageManager'],
        },
        getToken: () => Promise.resolve(FAKE_TOKEN),
      });

      // Mock MetalK8s as enabled
      (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(({ kind }: { kind: string }) => {
        if (kind === 'metalk8s-ui') {
          return [{ name: 'metalk8s-ui', kind: 'metalk8s-ui', version: '1.0', url: '', appHistoryBasePath: '' }];
        }
        return [{ kind: 'zenko-ui', name: 'zenko-ui.eu-west-1', version: '1.0', url: '', appHistoryBasePath: '' }];
      });

      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });

      await waitFor(() => {
        expect(selectors.truststoreLink()).not.toBeInTheDocument();
      });
    });
  });

  describe('routeWithoutSideBars (form routes)', () => {
    // Use empty basePath so pathname matches route as-is (test router has no basename)
    const basePath = '';

    beforeEach(() => {
      mockUseConfig.mockReturnValue({
        basePath,
        features: [],
        zenkoEndpoint: '/zenko/s3',
        iamEndpoint: '/zenko/iam',
        stsEndpoint: '/zenko/sts',
        managementEndpoint: '/zenko/management',
        s3InternalFQDN: 's3.test.local',
        iamInternalFQDN: 'iam.test.local',
      });
    });

    it('should hide sidebar and breadcrumb on simple form route (create-account)', async () => {
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/create-account',
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Account')).toBeInTheDocument();
      });
      expect(selectors.dataServicesLink()).not.toBeInTheDocument();
      expect(selectors.locationsLink()).not.toBeInTheDocument();
    });

    it('should hide sidebar and breadcrumb on complex form route (update-user)', async () => {
      jest.spyOn(hooks, 'useAccounts').mockReturnValue({
        accounts: [{ Name: 'my-account', id: '000000000000', Roles: [{ Arn: TEST_ROLE_ARN, Name: 'storage-manager-role' }] }],
      } as any);

      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts/my-account/users/john/update-user',
      });

      await waitFor(() => {
        expect(screen.getByText('Edit a User')).toBeInTheDocument();
      });
      expect(selectors.dataServicesLink()).not.toBeInTheDocument();
      expect(selectors.locationsLink()).not.toBeInTheDocument();
    });
  });

  describe('truststore routes', () => {
    afterEach(() => {
      (mockShellHooks.useDeployedApps as jest.Mock).mockReturnValue([]);
    });

    it('should render Truststore route when Platform Admin and MetalK8s is enabled', async () => {
      // Mock the hook to return PlatformAdmin user
      mockShellHooks.useAuth.mockReturnValue({
        userData: {
          token: FAKE_TOKEN,
          original: defautOriginal,
          groups: ['PlatformAdmin'],
        },
        getToken: () => Promise.resolve(FAKE_TOKEN),
      });

      // Mock MetalK8s as enabled
      (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(({ kind }: { kind: string }) => {
        if (kind === 'metalk8s-ui') {
          return [{ name: 'metalk8s-ui', kind: 'metalk8s-ui', version: '1.0', url: '', appHistoryBasePath: '' }];
        }
        return [{ kind: 'zenko-ui', name: 'zenko-ui.eu-west-1', version: '1.0', url: '', appHistoryBasePath: '' }];
      });

      // Mock useConfigRetriever to return proper runtime config for metalk8s
      mockShellHooks.useConfigRetriever.mockReturnValue({
        retrieveConfiguration: jest.fn(() => ({
          spec: {
            remoteEntryPath: '/remoteEntry.js',
            selfConfiguration: {
              url: 'http://metalk8s.test.local',
            },
          },
        })),
      });

      mockUseConfig.mockReturnValue({
        basePath: '/data',
        features: [],
        zenkoEndpoint: '/zenko/s3',
        iamEndpoint: '/zenko/iam',
        stsEndpoint: '/zenko/sts',
        managementEndpoint: '/zenko/management',
        s3InternalFQDN: 's3.test.local',
        iamInternalFQDN: 'iam.test.local',
      });

      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/truststore',
      });

      await waitFor(() => {
        expect(screen.getByText(/TLS Verification/i)).toBeInTheDocument();
      });
    });

    it('should not render Truststore route when Platform Admin but MetalK8s is disabled', async () => {
      // Mock the hook to return PlatformAdmin user
      mockShellHooks.useAuth.mockReturnValue({
        userData: {
          token: FAKE_TOKEN,
          original: defautOriginal,
          groups: ['PlatformAdmin'],
        },
        getToken: () => Promise.resolve(FAKE_TOKEN),
      });

      // Mock MetalK8s as disabled
      (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(({ kind }: { kind: string }) => {
        if (kind === 'metalk8s-ui') {
          return [];
        }
        return [{ kind: 'zenko-ui', name: 'zenko-ui.eu-west-1', version: '1.0', url: '', appHistoryBasePath: '' }];
      });

      mockUseConfig.mockReturnValue({
        basePath: '/data',
        features: [],
        zenkoEndpoint: '/zenko/s3',
        iamEndpoint: '/zenko/iam',
        stsEndpoint: '/zenko/sts',
        managementEndpoint: '/zenko/management',
        s3InternalFQDN: 's3.test.local',
        iamInternalFQDN: 'iam.test.local',
      });

      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/truststore',
      });

      // Truststore route should not be rendered - verify Truststore content is not present
      await waitFor(() => {
        expect(screen.queryByText(/Import Certificate/i)).not.toBeInTheDocument();
      });
    });

    it('should not render Truststore route when MetalK8s is enabled but not Platform Admin', async () => {
      // Mock the hook to return non PlatformAdmin user
      mockShellHooks.useAuth.mockReturnValue({
        userData: {
          token: FAKE_TOKEN,
          original: defautOriginal,
          groups: ['StorageManager'],
        },
        getToken: () => Promise.resolve(FAKE_TOKEN),
      });

      // Mock MetalK8s as enabled
      (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(({ kind }: { kind: string }) => {
        if (kind === 'metalk8s-ui') {
          return [{ name: 'metalk8s-ui', kind: 'metalk8s-ui', version: '1.0', url: '', appHistoryBasePath: '' }];
        }
        return [{ kind: 'zenko-ui', name: 'zenko-ui.eu-west-1', version: '1.0', url: '', appHistoryBasePath: '' }];
      });

      mockUseConfig.mockReturnValue({
        basePath: '/data',
        features: [],
        zenkoEndpoint: '/zenko/s3',
        iamEndpoint: '/zenko/iam',
        stsEndpoint: '/zenko/sts',
        managementEndpoint: '/zenko/management',
        s3InternalFQDN: 's3.test.local',
        iamInternalFQDN: 'iam.test.local',
      });

      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/truststore',
      });

      // Truststore route should not be rendered - verify Truststore content is not present
      await waitFor(() => {
        expect(screen.queryByText(/Import Certificate/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Browser route guards', () => {
    const STORAGE_USAGE_CONSUMER_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-usage-consumer-role';
    const STORAGE_MANAGER_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-manager-role';
    const STORAGE_ACCOUNT_OWNER_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-account-owner-role';

    afterEach(() => {
      removeRoleArnStored();
    });

    describe('accounts/:accountName/data/buckets route', () => {
      it('should render ErrorPage401 for storage-usage-consumer-role ARN', async () => {
        setRoleArnStored(STORAGE_USAGE_CONSUMER_ARN);

        renderWithRouterMatch(<PrivateRoutes />, {
          path: '/*',
          route: '/accounts/test/data/buckets',
        });

        await waitFor(() => {
          expect(screen.getByText(/Not authorized/i)).toBeInTheDocument();
        });
      });

      it('should render Data Browser for storage-manager-role ARN', async () => {
        setRoleArnStored(STORAGE_MANAGER_ARN);

        renderWithRouterMatch(<PrivateRoutes />, {
          path: '/*',
          route: '/accounts/test/data/buckets',
        });

        await waitFor(() => {
          expect(screen.queryByText(/Not authorized/i)).not.toBeInTheDocument();
        });
      });
    });

    describe('accounts/:accountName/buckets route', () => {
      it('should render ErrorPage401 for storage-usage-consumer-role ARN', async () => {
        setRoleArnStored(STORAGE_USAGE_CONSUMER_ARN);

        renderWithRouterMatch(<PrivateRoutes />, {
          path: '/*',
          route: '/accounts/test/buckets',
        });

        await waitFor(() => {
          expect(screen.getByText(/Not authorized/i)).toBeInTheDocument();
        });
      });

      it('should render Data Browser for storage-manager-role ARN', async () => {
        setRoleArnStored(STORAGE_MANAGER_ARN);

        renderWithRouterMatch(<PrivateRoutes />, {
          path: '/*',
          route: '/accounts/test/buckets',
        });

        await waitFor(() => {
          expect(screen.queryByText(/Not authorized/i)).not.toBeInTheDocument();
        });
      });
    });

    describe('buckets route', () => {
      it('should render ErrorPage401 for storage-usage-consumer-role ARN', async () => {
        setRoleArnStored(STORAGE_USAGE_CONSUMER_ARN);

        renderWithRouterMatch(<PrivateRoutes />, {
          path: '/*',
          route: '/buckets',
        });

        await waitFor(() => {
          expect(screen.getByText(/Not authorized/i)).toBeInTheDocument();
        });
      });

      it('should render redirect or empty state for storage-manager-role ARN', async () => {
        setRoleArnStored(STORAGE_MANAGER_ARN);

        renderWithRouterMatch(<PrivateRoutes />, {
          path: '/*',
          route: '/buckets',
        });

        await waitFor(() => {
          expect(screen.queryByText(/Not authorized/i)).not.toBeInTheDocument();
        });
      });
    });

    describe('sidebar Data Browser entry gating', () => {
      it('should hide Data Browser sidebar entry for storage-usage-consumer-role ARN', async () => {
        setRoleArnStored(STORAGE_USAGE_CONSUMER_ARN);

        renderWithRouterMatch(<InternalRoutes />, {
          path: '/*',
          route: '/accounts',
        });

        await waitFor(() => {
          expect(screen.queryByText('Data Browser')).not.toBeInTheDocument();
        });
      });

      it('should show Data Browser sidebar entry for storage-manager-role ARN', async () => {
        setRoleArnStored(STORAGE_MANAGER_ARN);

        renderWithRouterMatch(<InternalRoutes />, {
          path: '/*',
          route: '/accounts',
        });

        await waitFor(() => {
          expect(screen.queryByText('Data Browser')).toBeInTheDocument();
        });
      });

      it('should show Data Browser sidebar entry for storage-account-owner-role ARN', async () => {
        setRoleArnStored(STORAGE_ACCOUNT_OWNER_ARN);

        renderWithRouterMatch(<InternalRoutes />, {
          path: '/*',
          route: '/accounts',
        });

        await waitFor(() => {
          expect(screen.queryByText('Data Browser')).toBeInTheDocument();
        });
      });
    });
  });
});
