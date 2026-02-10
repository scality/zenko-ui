import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { mockOffsetSize, mockShellHooks, NewWrapper } from '../../utils/testUtil';
import { useParseBundleCertificates, useParseSecretCertificates } from '../hooks';
import Truststore, { type CertificateWithPEM } from '../Truststore';

// Mock Zenko CR endpoint URL
const TEST_URL = 'https://test-url';
const ZENKO_CR_URL = `${TEST_URL}/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data`;

// Mock useDeployedMetalk8sInstances
jest.mock('../../next-architecture/ui/ConfigProvider', () => ({
  ...jest.requireActual('../../next-architecture/ui/ConfigProvider'),
  useDeployedMetalk8sInstances: jest.fn(() => [{ name: 'test-instance' }]),
}));

// Mock hooks
jest.mock('../hooks', () => ({
  useParseBundleCertificates: jest.fn(),
  useParseSecretCertificates: jest.fn(),
}));

const mockUseParseBundleCertificates = useParseBundleCertificates as jest.MockedFunction<
  typeof useParseBundleCertificates
>;

const mockUseParseSecretCertificates = useParseSecretCertificates as jest.MockedFunction<
  typeof useParseSecretCertificates
>;

// Mock the delete mutation hook
const mockDeleteMutate = jest.fn();
const mockDeleteMutationResult = {
  mutate: mockDeleteMutate,
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
  useDeleteCertificateFromZenkoConfigurationMutation: jest.fn(() => mockDeleteMutationResult),
}));

import { useDeleteCertificateFromZenkoConfigurationMutation } from '../../../js/mutations';

const mockUseDeleteMutation = useDeleteCertificateFromZenkoConfigurationMutation as jest.MockedFunction<
  typeof useDeleteCertificateFromZenkoConfigurationMutation
>;

describe('Truststore', () => {
  const selectors = {
    pageTitle: () => screen.getByText('Truststore'),
    importButton: () => screen.getByRole('button', { name: /Import Certificate/i }),
    nameColumn: () => screen.getByText('Name'),
    expireOnColumn: () => screen.getByText('Expires On'),
    viewDetailsButton: () => screen.getByRole('button', { name: /View Details/i }),
    deleteButtons: () => screen.getAllByRole('button', { name: /Delete Certificate/i }),
    deleteButton: () => screen.getByRole('button', { name: /Delete Certificate/i }),
    deleteConfirmationModal: () => screen.getByText(/Delete.*from the truststore\?/i),
    deleteConfirmationDeleteButton: () => screen.getByRole('button', { name: 'Delete' }),
    deletingButton: () => screen.getByRole('button', { name: 'Deleting...' }),
    deleteCancelButton: () => screen.getByRole('button', { name: /Cancel/i }),
    deleteConfirmationQuery: () => screen.queryByText(/Remove.*from the truststore\?/i),
  };

  const MOCK_PEM_CERT = '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----';

  const mockCertificate1: CertificateWithPEM = {
    name: 'Test Certificate 1',
    authority: 'Test Authority 1',
    expiresOn: new Date('2026-10-05T00:00:00Z'),
    altNames: ['test1.com'],
    issuedOn: new Date('2025-10-05T00:00:00Z'),
    commonName: 'test1.example.com',
    organizations: ['Test Org 1'],
    organizationalUnits: ['Test Unit 1'],
    streetAddresses: ['123 Main St'],
    countries: ['US'],
    localities: ['San Francisco'],
    provinces: ['CA'],
    postalCodes: ['12345'],
    serialNumber: '123456',
    certificateHash: 'abc123',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMockPublicKey1\n-----END PUBLIC KEY-----',
    originalPEM: MOCK_PEM_CERT,
    rsaPublicKey: {
      modulus: 'mockModulus1',
      exponent: '01 00 01',
    },
  };

  // Mock Zenko CR data with certificates
  const mockZenkoCRWithCerts = {
    metadata: {
      generation: 1,
    },
    spec: {
      egress: {
        skipTLSVerify: false,
        extraCACerts: [{ 'ca.crt': 'cert1-data' }, { 'ca.crt': 'cert2-data' }],
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

  const server = setupServer(
    rest.get(ZENKO_CR_URL, (req, res, ctx) => {
      return res(ctx.json(mockZenkoCRWithCerts));
    }),
  );

  beforeAll(() => {
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
    mockOffsetSize(200, 800);
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    mockDeleteMutate.mockReset();
    (mockUseDeleteMutation as jest.Mock).mockReturnValue(mockDeleteMutationResult);
  });

  afterAll(() => {
    server.close();
  });

  it('should render header elements and table columns', () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [],
      isLoading: false,
    });
    mockUseParseSecretCertificates.mockReturnValue({
      parsedSecretCertificates: [],
      isLoading: false,
    });
    //E
    render(<Truststore />, { wrapper: NewWrapper() });
    //V
    /********** Page title and TLS Verification: ************/
    expect(selectors.pageTitle()).toBeInTheDocument();
    expect(screen.getByText('TLS Verification')).toBeInTheDocument();

    /********** Action button: ************/
    expect(selectors.importButton()).toBeInTheDocument();

    /********** Table columns: ************/
    expect(selectors.nameColumn()).toBeInTheDocument();
    expect(selectors.expireOnColumn()).toBeInTheDocument();
  });

  it('should display banner when TLS verification is skipped', async () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [],
      isLoading: false,
    });
    mockUseParseSecretCertificates.mockReturnValue({
      parsedSecretCertificates: [],
      isLoading: false,
    });
    server.use(
      rest.get(ZENKO_CR_URL, async (req, res, ctx) => {
        return res(
          ctx.json({
            ...mockZenkoCRWithCerts,
            spec: {
              ...mockZenkoCRWithCerts.spec,
              egress: {
                ...mockZenkoCRWithCerts.spec.egress,
                skipTLSVerify: true,
              },
            },
          }),
        );
      }),
    );
    //E
    render(<Truststore />, { wrapper: NewWrapper() });
    //V
    await waitFor(() => {
      expect(screen.getByText(/Imported certificates listed below are ignored/i)).toBeInTheDocument();
    });
  });

  it('should open certificate details modal when View Details is clicked', async () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [{ parsedCertificates: [mockCertificate1], index: 0 }],
      isLoading: false,
    });
    mockUseParseSecretCertificates.mockReturnValue({
      parsedSecretCertificates: [],
      isLoading: false,
    });

    //E
    render(<Truststore />, { wrapper: NewWrapper() });
    await waitFor(() => {
      expect(screen.queryByText(/Loading certificates/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(selectors.viewDetailsButton()).toBeInTheDocument();
    });

    await userEvent.click(selectors.viewDetailsButton());

    //V
    await waitFor(() => {
      expect(screen.getByText('Certificate Details')).toBeInTheDocument();
    });
  });

  it('should close certificate details modal when modal is closed', async () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [{ parsedCertificates: [mockCertificate1], index: 0 }],
      isLoading: false,
    });
    mockUseParseSecretCertificates.mockReturnValue({
      parsedSecretCertificates: [],
      isLoading: false,
    });
    //E
    render(<Truststore />, { wrapper: NewWrapper() });

    await waitFor(() => {
      expect(selectors.viewDetailsButton()).toBeInTheDocument();
    });

    // Open modal
    await userEvent.click(selectors.viewDetailsButton());

    await waitFor(() => {
      expect(screen.getByText('Certificate Details')).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole('button', { name: /Close/i })[0]);
    //V
    await waitFor(() => {
      expect(screen.queryByText('Certificate Details')).not.toBeInTheDocument();
    });
  });

  it('should display earliest expiration date when multiple certificates in chain', async () => {
    //S
    const mockCertificate2: CertificateWithPEM = {
      ...mockCertificate1,
      name: 'Root CA',
      authority: 'Root CA',
      expiresOn: new Date(2035, 10, 6), // Later than mockCertificate1
      commonName: 'root.example.com',
      originalPEM: MOCK_PEM_CERT,
    };

    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [{ parsedCertificates: [mockCertificate1, mockCertificate2], index: 0 }],
      isLoading: false,
    });
    mockUseParseSecretCertificates.mockReturnValue({
      parsedSecretCertificates: [],
      isLoading: false,
    });
    //E
    render(<Truststore />, { wrapper: NewWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/Loading certificates/i)).not.toBeInTheDocument();
    });

    //V
    expect(screen.getByText(/- 2026-10-05/i)).toBeInTheDocument();
  });

  it('should display certificate common names with chevron separators', async () => {
    //S
    const mockCertificate2: CertificateWithPEM = {
      ...mockCertificate1,
      name: 'Intermediate CA',
      authority: 'Root CA',
      commonName: 'intermediate.example.com',
      originalPEM: MOCK_PEM_CERT,
    };

    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [{ parsedCertificates: [mockCertificate1, mockCertificate2], index: 0 }],
      isLoading: false,
    });
    mockUseParseSecretCertificates.mockReturnValue({
      parsedSecretCertificates: [],
      isLoading: false,
    });
    //E
    render(<Truststore />, { wrapper: NewWrapper() });

    await waitFor(() => {
      expect(screen.queryByText(/Loading certificates/i)).not.toBeInTheDocument();
    });

    //V
    // Both certificate common names should be visible
    expect(screen.getByText('test1.example.com')).toBeInTheDocument();
    expect(screen.getByText('intermediate.example.com')).toBeInTheDocument();
  });

  describe('status handling', () => {
    it('should return "loading" when Zenko CR is loading', () => {
      //S
      mockUseParseBundleCertificates.mockReturnValue({
        parsedCertificates: [],
        isLoading: false,
      });
      mockUseParseSecretCertificates.mockReturnValue({
        parsedSecretCertificates: [],
        isLoading: false,
      });

      server.use(
        rest.get(ZENKO_CR_URL, async (req, res, ctx) => {
          // Delay to keep loading state
          await new Promise(() => {});
          return res(ctx.json(mockZenkoCRWithCerts));
        }),
      );
      //E
      render(<Truststore />, { wrapper: NewWrapper() });

      //V
      // Component should render with table in loading state
      expect(selectors.pageTitle()).toBeInTheDocument();
      expect(selectors.importButton()).toBeInTheDocument();
      expect(screen.getByText(/Loading certificates/i)).toBeInTheDocument();
    });

    it('should return "loading" when parsing certificates', () => {
      //S
      mockUseParseBundleCertificates.mockReturnValue({
        parsedCertificates: [],
        isLoading: true,
      });
      mockUseParseSecretCertificates.mockReturnValue({
        parsedSecretCertificates: [],
        isLoading: false,
      });
      //E
      render(<Truststore />, { wrapper: NewWrapper() });

      //V
      // Component should render with table in loading state
      expect(selectors.pageTitle()).toBeInTheDocument();
      expect(selectors.importButton()).toBeInTheDocument();
      expect(screen.getByText(/Loading certificates/i)).toBeInTheDocument();
    });
    it('should return "error" when Zenko CR fails to load', async () => {
      //S
      mockUseParseBundleCertificates.mockReturnValue({
        parsedCertificates: [],
        isLoading: false,
      });
      mockUseParseSecretCertificates.mockReturnValue({
        parsedSecretCertificates: [],
        isLoading: false,
      });

      server.use(
        rest.get(ZENKO_CR_URL, (req, res, ctx) => {
          return res(ctx.status(500), ctx.text('Internal server error'));
        }),
      );
      //E
      render(<Truststore />, { wrapper: NewWrapper() });

      //V
      // Component should render with table in error state
      expect(selectors.pageTitle()).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
      });
    });

    it('should return table data when Zenko CR and certificates are loaded successfully', async () => {
      //S
      mockUseParseBundleCertificates.mockReturnValue({
        parsedCertificates: [{ parsedCertificates: [mockCertificate1], index: 0 }],
        isLoading: false,
      });
      mockUseParseSecretCertificates.mockReturnValue({
        parsedSecretCertificates: [],
        isLoading: false,
      });
      //E
      render(<Truststore />, { wrapper: NewWrapper() });

      //V
      expect(selectors.pageTitle()).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByText(/Loading certificates/i)).not.toBeInTheDocument();
      });
      // Component should render with data in table
      expect(screen.getByText(mockCertificate1.commonName)).toBeInTheDocument();
      expect(screen.getByText(/- 2026-10-05/i)).toBeInTheDocument();
      expect(selectors.viewDetailsButton()).toBeInTheDocument();
      expect(selectors.deleteButton()).toBeInTheDocument();
    });
  });

  describe('delete confirmation modal', () => {
    it('should close delete confirmation modal when cancel button is clicked', async () => {
      //S
      mockUseParseBundleCertificates.mockReturnValue({
        parsedCertificates: [{ parsedCertificates: [mockCertificate1], index: 0 }],
        isLoading: false,
      });
      mockUseParseSecretCertificates.mockReturnValue({
        parsedSecretCertificates: [],
        isLoading: false,
      });
      //E
      render(<Truststore />, { wrapper: NewWrapper() });

      await waitFor(() => {
        expect(screen.queryByText(/loading certificates.../i)).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(selectors.deleteButton()).toBeInTheDocument();
      });

      await userEvent.click(selectors.deleteButton());

      await waitFor(() => {
        expect(selectors.deleteConfirmationModal()).toBeInTheDocument();
      });

      await userEvent.click(selectors.deleteCancelButton());

      //V
      await waitFor(() => {
        expect(selectors.deleteConfirmationQuery()).not.toBeInTheDocument();
      });
    });

    it('should delete certificate and close modal when delete button is clicked', async () => {
      //S
      mockUseParseBundleCertificates.mockReturnValue({
        parsedCertificates: [{ parsedCertificates: [mockCertificate1], index: 0 }],
        isLoading: false,
      });
      mockUseParseSecretCertificates.mockReturnValue({
        parsedSecretCertificates: [],
        isLoading: false,
      });

      // Mock the mutation to capture args and trigger success callback
      let capturedMutateArgs: any;
      (mockUseDeleteMutation as jest.Mock).mockImplementation((options: any) => ({
        ...mockDeleteMutationResult,
        mutate: (args: any) => {
          capturedMutateArgs = args;
          setTimeout(() => options?.onSuccess?.(), 0);
        },
      }));

      //E
      render(<Truststore />, { wrapper: NewWrapper() });

      await waitFor(() => {
        expect(selectors.deleteButton()).toBeInTheDocument();
      });

      await userEvent.click(selectors.deleteButton());

      await waitFor(() => {
        expect(selectors.deleteConfirmationModal()).toBeInTheDocument();
      });

      await userEvent.click(selectors.deleteConfirmationDeleteButton());

      //V
      // Modal should close
      await waitFor(() => {
        expect(selectors.deleteConfirmationQuery()).not.toBeInTheDocument();
      });

      // Success toast should appear
      await waitFor(() => {
        expect(screen.getByText(/Certificate deleted successfully/i)).toBeInTheDocument();
      });

      // Verify the mutation was called with correct args
      expect(capturedMutateArgs).toEqual({ certificateIndex: 0 });
    });

    it('should display error toast when delete fails', async () => {
      //S
      mockUseParseBundleCertificates.mockReturnValue({
        parsedCertificates: [{ parsedCertificates: [mockCertificate1], index: 0 }],
        isLoading: false,
      });
      mockUseParseSecretCertificates.mockReturnValue({
        parsedSecretCertificates: [],
        isLoading: false,
      });

      // Mock the mutation to trigger error callback
      (mockUseDeleteMutation as jest.Mock).mockImplementation((options: any) => ({
        ...mockDeleteMutationResult,
        mutate: () => {
          setTimeout(() => options?.onError?.(), 0);
        },
      }));

      //E
      render(<Truststore />, { wrapper: NewWrapper() });

      await waitFor(() => {
        expect(selectors.deleteButton()).toBeInTheDocument();
      });

      await userEvent.click(selectors.deleteButton());

      await waitFor(() => {
        expect(selectors.deleteConfirmationModal()).toBeInTheDocument();
      });

      // Click on confirm delete button
      await userEvent.click(selectors.deleteConfirmationDeleteButton());

      //V
      // Error toast should appear
      await waitFor(() => {
        expect(screen.getByText(/Failed to delete certificate/i)).toBeInTheDocument();
      });
    });
  });
});
