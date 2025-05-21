import { screen, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { useIsVeeamVBROnly } from './ISV/hooks/useIsVeeamVBROnly';
import InternalRoutes, { PrivateRoutes } from './Routes';
import { renderWithRouterMatch } from './utils/testUtil';

// Mock useIsVeeamVBROnly as it comes from ShellHooks
jest.mock('./ISV/hooks/useIsVeeamVBROnly');
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

describe('Routes component', () => {
  const mockUseIsVeeamVBROnly = useIsVeeamVBROnly as jest.Mock;
  const mockUseSelector = useSelector as jest.Mock;
  const mockUseDispatch = useDispatch as jest.Mock;
  const selectors = {
    loadingAccounts: () => screen.queryByText(/Loading accounts/i),
    loadingDataServices: () => screen.queryByText(/Loading Data Services/i),
    createDataService: () => screen.queryByText(/Create new Data Service/i),
    loadingClients: () => screen.queryByText(/Loading clients/i),
    dataServicesLink: () => screen.queryByText(/Data Services/i),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseDispatch.mockReturnValue(jest.fn());

    // Setup the default state for useSelector
    mockUseSelector.mockImplementation((selector) => {
      // Create a mock state that has the necessary fields
      const mockState = {
        auth: {
          isClientsLoaded: true,
          config: {
            managementEndpoint: 'http://test-endpoint.com',
          },
          oidcLogout: jest.fn(),
        },
        oidc: {
          user: {
            access_token: 'mock-token',
            expired: false,
            expires_at: Date.now() / 1000 + 3600, // 1 hour from now
          },
        },
        configuration: {
          latest: {
            version: 1,
          },
        },
      };

      // Pass the mock state to the selector function
      return selector(mockState);
    });
  });

  it('should show loading state when isClientsLoaded is false', async () => {
    // Override the default mock to set isClientsLoaded to false
    mockUseSelector.mockImplementation((selector) => {
      const mockState = {
        auth: {
          isClientsLoaded: false,
          config: {
            managementEndpoint: 'http://test-endpoint.com',
          },
        },
        oidc: {
          user: {
            access_token: 'mock-token',
            expired: false,
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

  it('should render the Create Data Service page in standard configuration', async () => {
    // Mock the hook to return false
    mockUseIsVeeamVBROnly.mockReturnValue(false);

    // Render with the create-dataservice route
    renderWithRouterMatch(<PrivateRoutes />, {
      path: '/*',
      route: '/create-dataservice',
    });

    await waitFor(() => {
      expect(selectors.createDataService()).toBeInTheDocument();
    });
  });

  it('should not render the Create Data Service page in ARTESCA+VEEAM configuration', async () => {
    // Mock the hook to return true
    mockUseIsVeeamVBROnly.mockReturnValue(true);

    // Render with the create-dataservice route
    renderWithRouterMatch(<PrivateRoutes />, {
      path: '/*',
      route: '/create-dataservice',
    });

    // Verify that it redirects to accounts
    await waitFor(() => {
      expect(selectors.createDataService()).not.toBeInTheDocument();
      expect(selectors.loadingAccounts()).toBeInTheDocument();
    });
  });

  it('should render the Data Services page in standard configuration', async () => {
    // Mock the hook to return false
    mockUseIsVeeamVBROnly.mockReturnValue(false);

    // Render with the dataservices route
    renderWithRouterMatch(<PrivateRoutes />, {
      path: '/*',
      route: '/dataservices',
    });

    await waitFor(() => {
      expect(selectors.loadingDataServices()).toBeInTheDocument();
    });
  });

  it('should not render the Data Services page in ARTESCA+VEEAM configuration', async () => {
    // Mock the hook to return true
    mockUseIsVeeamVBROnly.mockReturnValue(true);

    // Render with the dataservices route
    renderWithRouterMatch(<PrivateRoutes />, {
      path: '/*',
      route: '/dataservices',
    });

    await waitFor(() => {
      expect(selectors.loadingDataServices()).not.toBeInTheDocument();
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
    it('should hide Data Services from sidebar in ARTESCA+VEEAM configuration', async () => {
      // Mock the hook to return true
      mockUseIsVeeamVBROnly.mockReturnValue(true);

      // Render InternalRoutes with any route
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });

      // Check that Data Services link is not in the sidebar
      await waitFor(() => {
        expect(selectors.dataServicesLink()).not.toBeInTheDocument();
      });
    });

    it('should show Data Services in sidebar in standard configuration', async () => {
      // Mock the hook to return false
      mockUseIsVeeamVBROnly.mockReturnValue(false);

      // Render InternalRoutes with any route
      renderWithRouterMatch(<InternalRoutes />, {
        path: '/*',
        route: '/accounts',
      });

      // Check that Data Services link is in the sidebar
      await waitFor(() => {
        expect(selectors.dataServicesLink()).toBeInTheDocument();
      });
    });
  });
});
