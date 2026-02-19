import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { mockShellHooks, NewWrapper, renderWithCustomRoute } from '../../utils/testUtil';
import ImportCertificate from '../ImportCertificate';

// Mock Zenko CR endpoint URL
const TEST_URL = 'https://test-url';
const ZENKO_CR_URL = `${TEST_URL}/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data`;

// Mock useDeployedMetalk8sInstances
jest.mock('../../next-architecture/ui/ConfigProvider', () => ({
  ...jest.requireActual('../../next-architecture/ui/ConfigProvider'),
  useDeployedMetalk8sInstances: jest.fn(() => [{ name: 'test-instance' }]),
}));

// Mock the mutation hook
const mockMutate = jest.fn();
const mockMutationResult = {
  mutate: mockMutate,
  isLoading: false,
  isIdle: true,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  reset: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle' as const,
  variables: undefined,
  context: undefined,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
};

jest.mock('../../../js/mutations', () => ({
  ...jest.requireActual('../../../js/mutations'),
  useAddCertificateToZenkoConfigurationMutation: jest.fn(() => mockMutationResult),
}));

import { useAddCertificateToZenkoConfigurationMutation } from '../../../js/mutations';

const mockUseAddCertificateMutation = useAddCertificateToZenkoConfigurationMutation as jest.MockedFunction<
  typeof useAddCertificateToZenkoConfigurationMutation
>;

// Mock certificate validation
jest.mock('@scality/certchain', () => ({
  isValidTrustedCACertificate: jest.fn((pemBundle: string) => {
    // Return true if it looks like a proper PEM format and doesn't contain 'INVALID'
    return (
      pemBundle.includes('-----BEGIN CERTIFICATE-----') &&
      pemBundle.includes('-----END CERTIFICATE-----') &&
      !pemBundle.includes('INVALID')
    );
  }),
}));

// Mock certificates for testing
const mockedValidCertificate = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRkmUMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAlVTMQ0wCwYDVQQIDARUZXN0MQ0wCwYDVQQHDARUZXN0MQ0wCwYDVQQKDART
ZXN0MRkwFwYDVQQDDBBUZXN0IFJvb3QgQ0EwHhcNMjUwMTAxMDAwMDAwWhcNMzUw
MTAxMDAwMDAwWjBFMQswCQYDVQQGEwJVUzENMAsGA1UECAwEVGVzdDENMAsGA1UE
BwwEVGVzdDENMAsGA1UECgwEVGVzdDEZMBcGA1UEAwwQVGVzdCBSb290IENBMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwVw8fPxT
-----END CERTIFICATE-----`;

const mockedInvalidCertificate = `-----BEGIN CERTIFICATE-----
INVALID CERTIFICATE
-----END CERTIFICATE-----`;
describe('ImportCertificate', () => {
  const selectors = {
    importButton: () => screen.getByRole('button', { name: /Import/i }),
    importingButton: () => screen.queryByRole('button', { name: /Importing certificate.../i }),
    cancelButton: () => screen.getByRole('button', { name: /Cancel/i }),
    formTitle: () => screen.getByText(/Import a new Certificate/i),
    dragAndDropLabel: () => screen.getByText(/Drag and drop file here/i),
    certificateInput: () => screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
  };

  // Mock Zenko CR data with extraCACerts
  const mockZenkoCRWithCerts = {
    metadata: {
      generation: 1,
    },
    spec: {
      egress: {
        extraCACerts: [{ 'ca.crt': 'existing-cert-1' }],
      },
    },
    status: {
      observedGeneration: 1,
      conditions: [
        { type: 'Available', status: 'True' },
        { type: 'DeploymentInProgress', status: 'False' },
      ],
    },
  };

  // Mock Zenko CR data without extraCACerts
  const mockZenkoCRWithoutCerts = {
    metadata: {
      generation: 1,
    },
    spec: {
      egress: {},
    },
    status: {
      observedGeneration: 1,
      conditions: [
        { type: 'Available', status: 'True' },
        { type: 'DeploymentInProgress', status: 'False' },
      ],
    },
  };

  const server = setupServer(
    // GET Zenko CR - only for useQuery to fetch initial state
    rest.get(ZENKO_CR_URL, (_req, res, ctx) => {
      return res(ctx.json(mockZenkoCRWithoutCerts));
    }),
  );

  beforeAll(() => {
    // Update mockShellHooks to include selfConfiguration.url
    mockShellHooks.useConfigRetriever.mockReturnValue({
      retrieveConfiguration: jest.fn(() => ({
        spec: {
          remoteEntryPath: '/remoteEntry.js',
          selfConfiguration: {
            url: TEST_URL,
          },
        },
      })),
    });

    server.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    mockMutate.mockReset();
    (mockUseAddCertificateMutation as jest.Mock).mockReturnValue(mockMutationResult);
  });

  afterAll(() => {
    server.close();
  });

  it('should render', () => {
    render(<ImportCertificate />, { wrapper: NewWrapper() });
    expect(selectors.importButton()).toBeDisabled();
    expect(selectors.formTitle()).toBeInTheDocument();
    expect(selectors.dragAndDropLabel()).toBeInTheDocument();
    expect(selectors.cancelButton()).toBeInTheDocument();
    expect(selectors.certificateInput()).toBeInTheDocument();
  });

  it('should enable Import button if form is valid', async () => {
    render(<ImportCertificate />, { wrapper: NewWrapper() });
    expect(selectors.importButton()).toBeDisabled();

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    expect(selectors.importButton()).toBeEnabled();
  });

  it('should navigate to truststore page if Cancel button is clicked', async () => {
    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route path="/truststore/import-certificate" element={<ImportCertificate />} />
      </Routes>,
      '/truststore/import-certificate',
    );
    expect(selectors.formTitle()).toBeInTheDocument();
    expect(selectors.cancelButton()).toBeInTheDocument();
    await userEvent.click(selectors.cancelButton());
    expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
  });
  it('should navigate to truststore page if import is successful and show success toast', async () => {
    // Mock mutation to trigger success callback
    (mockUseAddCertificateMutation as jest.Mock).mockImplementation(() => ({
      ...mockMutationResult,
      mutate: (_args: any, options: any) => {
        setTimeout(() => options?.onSuccess?.(), 0);
      },
    }));

    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route path="/truststore/import-certificate" element={<ImportCertificate />} />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    expect(selectors.importButton()).toBeEnabled();
    await userEvent.click(selectors.importButton());

    await waitFor(() => {
      expect(screen.getByText(/Certificate imported successfully/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
  });

  it('should show error toast if import fails', async () => {
    // Mock mutation to trigger error callback
    (mockUseAddCertificateMutation as jest.Mock).mockImplementation(() => ({
      ...mockMutationResult,
      mutate: (_args: any, options: any) => {
        setTimeout(() => options?.onError?.(), 0);
      },
    }));

    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route path="/truststore/import-certificate" element={<ImportCertificate />} />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    expect(selectors.importButton()).toBeEnabled();
    await userEvent.click(selectors.importButton());

    await waitFor(() => {
      expect(screen.getByText(/Failed to import certificate/i)).toBeInTheDocument();
    });
  });

  it('should call mutation with correct certificate when importing', async () => {
    let capturedArgs: any;
    let capturedHookArgs: any;

    // Mock mutation to capture args
    (mockUseAddCertificateMutation as jest.Mock).mockImplementation((hookArgs: any) => {
      capturedHookArgs = hookArgs;
      return {
        ...mockMutationResult,
        mutate: (args: any, options: any) => {
          capturedArgs = args;
          setTimeout(() => options?.onSuccess?.(), 0);
        },
      };
    });

    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route path="/truststore/import-certificate" element={<ImportCertificate />} />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    await userEvent.click(selectors.importButton());

    await waitFor(() => {
      expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
    });

    // Verify mutation was called with correct certificate
    expect(capturedArgs).toEqual({ certificate: mockedValidCertificate });
    // Verify hook was called with correct hasEgress/hasExtraCACerts flags
    expect(capturedHookArgs).toEqual({
      hasEgress: true, // mockZenkoCRWithoutCerts has egress: {}
      hasExtraCACerts: false, // mockZenkoCRWithoutCerts has no extraCACerts
    });
  });

  it('should pass hasExtraCACerts=true when Zenko CR has existing certs', async () => {
    let capturedHookArgs: any;

    // Mock GET to return CR with existing certs
    server.use(
      rest.get(ZENKO_CR_URL, (_req, res, ctx) => {
        return res(ctx.json(mockZenkoCRWithCerts));
      }),
    );

    // Mock mutation to capture hook args
    (mockUseAddCertificateMutation as jest.Mock).mockImplementation((hookArgs: any) => {
      capturedHookArgs = hookArgs;
      return {
        ...mockMutationResult,
        mutate: (_args: any, options: any) => {
          setTimeout(() => options?.onSuccess?.(), 0);
        },
      };
    });

    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route path="/truststore/import-certificate" element={<ImportCertificate />} />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    await userEvent.click(selectors.importButton());

    await waitFor(() => {
      expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
    });

    // Verify hook was called with correct flags
    expect(capturedHookArgs).toEqual({
      hasEgress: true,
      hasExtraCACerts: true, // mockZenkoCRWithCerts has extraCACerts
    });
  });
  it('should show error message and disable import button if certificate is empty', async () => {
    render(<ImportCertificate />, { wrapper: NewWrapper() });

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    await userEvent.clear(selectors.certificateInput());

    expect(selectors.importButton()).toBeDisabled();
    await waitFor(() => {
      expect(screen.getByText(/Certificate is required/i)).toBeInTheDocument();
    });
  });

  it('should show error message and disable import button if certificate chain is invalid', async () => {
    render(<ImportCertificate />, { wrapper: NewWrapper() });
    await userEvent.type(selectors.certificateInput(), mockedInvalidCertificate);

    await waitFor(() => {
      expect(selectors.importButton()).toBeDisabled();
      expect(
        screen.getByText(/Invalid certificate. The certificate should be a valid PEM x509 file/i),
      ).toBeInTheDocument();
    });
  });
});
