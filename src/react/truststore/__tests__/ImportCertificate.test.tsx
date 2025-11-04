import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import {
  NewWrapper,
  renderWithCustomRoute,
  mockShellHooks,
} from '../../utils/testUtil';
import ImportCertificate from '../ImportCertificate';

// Mock Zenko CR endpoint URL
const TEST_URL = 'https://test-url';
const ZENKO_CR_URL = `${TEST_URL}/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data`;

// Mock useDeployedMetalk8sInstances
jest.mock('../../next-architecture/ui/ConfigProvider', () => ({
  ...jest.requireActual('../../next-architecture/ui/ConfigProvider'),
  useDeployedMetalk8sInstances: jest.fn(() => [{ name: 'test-instance' }]),
}));

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
    cancelButton: () => screen.getByRole('button', { name: /Cancel/i }),
    formTitle: () => screen.getByText(/Import a new Certificate/i),
    dragAndDropLabel: () => screen.getByText(/Drag and drop file here/i),
    certificateInput: () =>
      screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
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

  let patchCount = 0;

  const server = setupServer(
    // GET Zenko CR - handles both query and polling
    rest.get(ZENKO_CR_URL, (req, res, ctx) => {
      // After PATCH, return CR with synchronized status for polling
      if (patchCount > 0) {
        return res(
          ctx.json({
            ...mockZenkoCRWithoutCerts,
            metadata: { generation: 2 },
            status: {
              observedGeneration: 2,
              conditions: [
                { type: 'Available', status: 'True' },
                { type: 'DeploymentInProgress', status: 'False' },
              ],
            },
          }),
        );
      }
      // Before PATCH, return initial CR
      return res(ctx.json(mockZenkoCRWithoutCerts));
    }),
    // PATCH Zenko CR success
    rest.patch(ZENKO_CR_URL, (req, res, ctx) => {
      patchCount++;
      return res(ctx.json({ status: 'Success' }));
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
    patchCount = 0;
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
        <Route
          path="/truststore/import-certificate"
          element={<ImportCertificate />}
        />
      </Routes>,
      '/truststore/import-certificate',
    );
    expect(selectors.formTitle()).toBeInTheDocument();
    expect(selectors.cancelButton()).toBeInTheDocument();
    await userEvent.click(selectors.cancelButton());
    expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
  });
  it('should navigate to truststore page if import is successful and show success toast', async () => {
    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route
          path="/truststore/import-certificate"
          element={<ImportCertificate />}
        />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    expect(selectors.importButton()).toBeEnabled();
    await userEvent.click(selectors.importButton());
    expect(
      screen.getByRole('button', { name: /Importing certificate.../i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Certificate imported successfully/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
  });

  it('should show error toast if import fails', async () => {
    // Mock failed PATCH request
    server.use(
      rest.patch(ZENKO_CR_URL, (req, res, ctx) => {
        return res(ctx.json({ status: 'Failure', message: 'Import failed' }));
      }),
    );

    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route
          path="/truststore/import-certificate"
          element={<ImportCertificate />}
        />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    expect(selectors.importButton()).toBeEnabled();
    await userEvent.click(selectors.importButton());

    await waitFor(
      () => {
        expect(
          screen.getByText(/Failed to import certificate/i),
        ).toBeInTheDocument();
      },
      {
        timeout: 10000,
      },
    );
  });

  it('should send correct patch to append when Zenko CR has existing certs', async () => {
    let patchBody: any;
    let localPatchCount = 0;

    // Mock GET to return CR with existing certs
    server.use(
      rest.get(ZENKO_CR_URL, (req, res, ctx) => {
        // After PATCH, return synchronized CR for polling
        if (localPatchCount > 0) {
          return res(
            ctx.json({
              ...mockZenkoCRWithCerts,
              metadata: { generation: 2 },
              status: {
                observedGeneration: 2,
                conditions: [
                  { type: 'Available', status: 'True' },
                  { type: 'DeploymentInProgress', status: 'False' },
                ],
              },
            }),
          );
        }
        return res(ctx.json(mockZenkoCRWithCerts));
      }),
      rest.patch(ZENKO_CR_URL, (req, res, ctx) => {
        patchBody = req.body;
        localPatchCount++;
        return res(ctx.json({ status: 'Success' }));
      }),
    );

    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route
          path="/truststore/import-certificate"
          element={<ImportCertificate />}
        />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    await userEvent.click(selectors.importButton());

    await waitFor(() => {
      expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
    });

    // Verify patch uses append operation (/-) for existing array
    expect(patchBody).toEqual([
      {
        op: 'add',
        path: '/spec/egress/extraCACerts/-',
        value: { 'ca.crt': mockedValidCertificate },
      },
    ]);
  });

  it('should send correct patch to initialize when Zenko CR has no certs', async () => {
    let patchBody: any;
    let localPatchCount = 0;

    // Override handlers to capture patch body and handle polling
    server.use(
      rest.get(ZENKO_CR_URL, (req, res, ctx) => {
        // After PATCH, return synchronized CR for polling
        if (localPatchCount > 0) {
          return res(
            ctx.json({
              ...mockZenkoCRWithoutCerts,
              metadata: { generation: 2 },
              status: {
                observedGeneration: 2,
                conditions: [
                  { type: 'Available', status: 'True' },
                  { type: 'DeploymentInProgress', status: 'False' },
                ],
              },
            }),
          );
        }
        return res(ctx.json(mockZenkoCRWithoutCerts));
      }),
      rest.patch(ZENKO_CR_URL, (req, res, ctx) => {
        patchBody = req.body;
        localPatchCount++;
        return res(ctx.json({ status: 'Success' }));
      }),
    );

    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route
          path="/truststore/import-certificate"
          element={<ImportCertificate />}
        />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), mockedValidCertificate);
    await userEvent.click(selectors.importButton());

    await waitFor(() => {
      expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
    });

    // Verify patch initializes new array
    expect(patchBody).toEqual([
      {
        op: 'add',
        path: '/spec/egress/extraCACerts',
        value: [{ 'ca.crt': mockedValidCertificate }],
      },
    ]);
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
    await userEvent.type(
      selectors.certificateInput(),
      mockedInvalidCertificate,
    );

    await waitFor(() => {
      expect(selectors.importButton()).toBeDisabled();
      expect(screen.getByText(/Invalid certificate./i)).toBeInTheDocument();
    });
  });
});
