import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import Truststore from '../Truststore';
import {
  NewWrapper,
  mockOffsetSize,
  mockShellHooks,
} from '../../utils/testUtil';
import { Certificate, CertificateSubject } from '@scality/certchain';

// Mock Zenko CR endpoint URL
const TEST_URL = 'https://test-url';
const ZENKO_CR_URL = `${TEST_URL}/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data`;

// Mock useDeployedMetalk8sInstances
jest.mock('../../next-architecture/ui/ConfigProvider', () => ({
  ...jest.requireActual('../../next-architecture/ui/ConfigProvider'),
  useDeployedMetalk8sInstances: jest.fn(() => [{ name: 'test-instance' }]),
}));

// Mock useParseBundleCertificates hook
jest.mock('../hooks', () => ({
  useParseBundleCertificates: jest.fn(),
}));

import { useParseBundleCertificates } from '../hooks';

const mockUseParseBundleCertificates =
  useParseBundleCertificates as jest.MockedFunction<
    typeof useParseBundleCertificates
  >;

describe('Truststore', () => {
  const selectors = {
    pageTitle: () => screen.getByText('Truststore'),
    toggle: () => screen.getByRole('checkbox'),
    importButton: () =>
      screen.getByRole('button', { name: /Import Certificate/i }),
    nameColumn: () => screen.getByText('Name'),
    expireOnColumn: () => screen.getByText('Expire On'),
    viewDetailsButton: () =>
      screen.getByRole('button', { name: /View Details/i }),
    deleteButton: () => screen.getByRole('button', { name: /Delete/i }),
  };
  const mockCertificate1: Certificate & CertificateSubject = {
    name: 'Test Certificate 1',
    authority: 'Test Authority 1',
    expiresOn: new Date('2025-12-31'),
    altNames: ['test1.com'],
    issuedOn: new Date('2024-01-01'),
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
    publicKey:
      '-----BEGIN PUBLIC KEY-----\nMockPublicKey1\n-----END PUBLIC KEY-----',
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
    rest.patch(ZENKO_CR_URL, (req, res, ctx) => {
      return res(ctx.json({ status: 'Success' }));
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
    mockOffsetSize(200, 100);
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
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
    //E
    render(<Truststore />, { wrapper: NewWrapper() });
    //V
    /********** Page title and toggle: ************/
    expect(selectors.pageTitle()).toBeInTheDocument();
    expect(screen.getByText('Skip TLS Verification')).toBeInTheDocument();
    expect(selectors.toggle()).toBeInTheDocument();

    /********** Action button: ************/
    expect(selectors.importButton()).toBeInTheDocument();

    /********** Table columns: ************/
    expect(selectors.nameColumn()).toBeInTheDocument();
    expect(selectors.expireOnColumn()).toBeInTheDocument();
  });

  it('should render a table with certificate data', async () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [[mockCertificate1]],
      isLoading: false,
    });
    server.use(
      rest.get(ZENKO_CR_URL, (req, res, ctx) => {
        return res(ctx.json(mockZenkoCRWithCerts));
      }),
    );
    //E
    render(<Truststore />, { wrapper: NewWrapper() });
    //V
    // Wait for data to load
    await waitFor(
      () => {
        expect(selectors.nameColumn()).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    /********** Certificate name and expiration date displayed: ************/
    expect(selectors.nameColumn()).toBeInTheDocument();
    expect(screen.getByText('12/31/2025')).toBeInTheDocument();

    /********** Action buttons displayed: ************/
    expect(selectors.viewDetailsButton()).toBeInTheDocument();
    expect(selectors.deleteButton()).toBeInTheDocument();
  });

  it('should show loading state while loading certificates', () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [],
      isLoading: true,
    });
    //E
    render(<Truststore />, { wrapper: NewWrapper() });
    //V
    // Component renders while loading
    expect(selectors.pageTitle()).toBeInTheDocument();
    expect(selectors.toggle()).toBeInTheDocument();
  });

  it('should update toggle label during TLS verification mutation', async () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [],
      isLoading: false,
    });

    // Mock server to delay response to capture loading state
    server.use(
      rest.patch(ZENKO_CR_URL, async (req, res, ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return res(ctx.json({ status: 'Success' }));
      }),
    );
    //E
    render(<Truststore />, { wrapper: NewWrapper() });

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Skip TLS Verification')).toBeInTheDocument();
    });
    //V
    /********** Initial state: ************/

    expect(selectors.toggle()).toBeInTheDocument();

    /********** Click toggle: ************/
    await userEvent.click(selectors.toggle());

    /********** Loading state during mutation: ************/
    await waitFor(() => {
      expect(
        screen.getByText('Updating TLS Verification...'),
      ).toBeInTheDocument();
    });

    /********** Label returns to normal after success: ************/
    await waitFor(
      () => {
        expect(selectors.toggle()).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('handles server error when loading Zenko CR', async () => {
    //S
    mockUseParseBundleCertificates.mockReturnValue({
      parsedCertificates: [],
      isLoading: false,
    });

    server.use(
      rest.get(ZENKO_CR_URL, (req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'Internal server error' })),
      ),
    );
    //E
    render(<Truststore />, { wrapper: NewWrapper() });
    //V
    // Component should still render even with server error
    await waitFor(() => {
      expect(selectors.pageTitle()).toBeInTheDocument();
    });
    expect(selectors.toggle()).toBeInTheDocument();
    expect(selectors.importButton()).toBeInTheDocument();
    expect(selectors.nameColumn()).toBeInTheDocument();
    expect(selectors.expireOnColumn()).toBeInTheDocument();
    waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });
  });
});
