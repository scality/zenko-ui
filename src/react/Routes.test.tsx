import { screen, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import InternalRoutes, { PrivateRoutes } from './Routes';
import {
  FAKE_TOKEN,
  mockShellHooks,
  renderWithRouterMatch,
} from './utils/testUtil';
import { useArtescaLibrary } from './next-architecture/ui/ArtescaLibraryProvider';

// Mock useArtescaLibrary
jest.mock('./next-architecture/ui/ArtescaLibraryProvider');

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

describe('Routes component', () => {
  const mockUseArtescaLibrary = useArtescaLibrary as jest.Mock;
  const mockUseSelector = useSelector as jest.Mock;
  const mockUseDispatch = useDispatch as jest.Mock;
  const selectors = {
    loadingAccounts: () => screen.queryByText(/Loading accounts/i),
    loadingDataServices: () => screen.queryByText(/Loading Data Services/i),
    createDataService: () => screen.queryByText(/Create new Data Service/i),
    loadingClients: () => screen.queryByText(/Loading clients/i),
    dataServicesLink: () => screen.queryByText(/Data Services/i),
    locationsLink: () => screen.queryByText(/Locations/i),
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
            session_state: 'session-state-1',
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
  });
});
