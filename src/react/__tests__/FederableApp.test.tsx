import { useToast } from '@scality/core-ui';
import { coreUIAvailableThemes } from '@scality/core-ui/dist/style/theme';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';

const PROBE_MESSAGE = 'toast-wirer-probe-message';

jest.mock('react-query/devtools', () => ({
  ReactQueryDevtools: () => null,
}));

jest.mock('../ZenkoUI', () => ({
  __esModule: true,
  default: () => <div data-testid="zenko-ui" />,
}));

jest.mock('../AuthLoadingProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../ErrorProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../next-architecture/ui/AccessibleAccountsAdapterProvider', () => ({
  AccessibleAccountsAdapterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../next-architecture/ui/LocationsEndpointsAdapterProvider', () => ({
  LocationsEndpointsAdapterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../next-architecture/ui/ArtescaLibraryProvider', () => ({
  ArtescaLibraryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../next-architecture/ui/LocationAdapterProvider', () => ({
  LocationAdapterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../next-architecture/ui/MetricsAdapterProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../next-architecture/ui/XCoreLibraryProvider', () => ({
  XCoreLibraryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import FederableApp from '../FederableApp';

const dataBrowserLibrary = jest.requireMock('@scality/data-browser-library');
const moduleFederation = jest.requireMock('@scality/module-federation');
const ToastWirerProbe = () => {
  const { showToast } = useToast();
  useEffect(() => {
    showToast({ open: true, status: 'error', message: PROBE_MESSAGE });
  }, [showToast]);
  return <div data-testid="toast-wirer" />;
};

const theme = coreUIAvailableThemes.darkRebrand;

function renderFederableApp() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <FederableApp shellHooks={{}} shellAlerts={{}} />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('FederableApp', () => {
  beforeEach(() => {
    dataBrowserLibrary.ToastWirer = ToastWirerProbe;
    jest.spyOn(moduleFederation, 'useCurrentApp').mockReturnValue({ kind: 'zenko-ui' } as any);
  });

  it('renders the data-browser-library ToastWirer', () => {
    renderFederableApp();

    expect(screen.getByTestId('toast-wirer')).toBeInTheDocument();
  });

  it('renders the ToastWirer exactly once', () => {
    renderFederableApp();

    expect(screen.getAllByTestId('toast-wirer')).toHaveLength(1);
  });

  it('renders the ToastWirer inside the core-ui ToastProvider', async () => {
    renderFederableApp();

    expect(await screen.findByText(PROBE_MESSAGE)).toBeInTheDocument();
  });
});
