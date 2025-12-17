import { screen, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import InternalRoutes, { PrivateRoutes } from './Routes';
import {
  FAKE_TOKEN,
  mockShellHooks,
  renderWithRouterMatch,
} from './utils/testUtil';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import { useAuthLoading } from './AuthLoadingProvider';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('./next-architecture/ui/ConfigProvider', () => ({
  useConfig: jest.fn(),
}));

jest.mock('./AuthLoadingProvider', () => ({
  useAuthLoading: jest.fn(),
}));

describe('Routes component', () => {
  const mockUseSelector = useSelector as jest.Mock;
  const mockUseDispatch = useDispatch as jest.Mock;
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

    // Default mock implementations
    mockUseDispatch.mockReturnValue(jest.fn());

    // Default mock for useAuthLoading - clients loaded
    mockUseAuthLoading.mockReturnValue({
      isConfigLoaded: true,
      isClientsLoaded: true,
      configFailure: false,
      configFailureErrorMessage: '',
    });

    // Setup the default state for useSelector
    mockUseSelector.mockImplementation((selector) => {
      // Create a mock state that has the necessary fields
      const mockState = {
        auth: {
          isClientsLoaded: true,
          config: {
            managementEndpoint: 'http://test-endpoint.com',
          },
        },
      };
      // Pass the mock state to the selector function
      return selector(mockState);
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

    mockUseSelector.mockImplementation((selector) => {
      const mockState = {
        auth: {
          isClientsLoaded: false,
          config: {
            managementEndpoint: 'http://test-endpoint.com',
          },
        },
      };
      return selector(mockState);
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

    it('should show Truststore in sidebar for Platform Admin', async () => {
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

    it('should not show Truststore in sidebar for non Platform Admin', async () => {
      // Setup Mock the hook to return non PlatformAdmin user
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
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });
      // V
      await waitFor(() => {
        expect(selectors.truststoreLink()).not.toBeInTheDocument();
      });
    });
  });
});
