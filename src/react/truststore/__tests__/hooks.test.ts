import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import {
  useParseBundleCertificates,
  ZenkoCRCertificateBundle,
  useParseSecretCertificates,
} from '../hooks';
import type { ParsedCertificate } from '@scality/certchain';

import { parseCertificateFromPEM, extractPemParts } from '@scality/certchain';
import { useK8sSecretQueries } from '../../queries';

jest.mock('@scality/certchain');
jest.mock('../../queries', () => ({
  useK8sSecretQueries: jest.fn(),
}));

const mockParseCertificateFromPEM =
  parseCertificateFromPEM as jest.MockedFunction<
    typeof parseCertificateFromPEM
  >;
const mockExtractPemParts = extractPemParts as jest.MockedFunction<
  typeof extractPemParts
>;
const mockUseK8sSecretQueries = useK8sSecretQueries as jest.MockedFunction<
  typeof useK8sSecretQueries
>;

const mockCertificate1: ParsedCertificate = {
  name: 'Test Certificate 1',
  authority: 'Test Authority 1',
  expiresOn: new Date('2025-01-01'),
  altNames: ['test.com'],
  issuedOn: new Date('2024-01-01'),
  commonName: 'Test Certificate 1',
  organizations: ['Test Org 1'],
  organizationalUnits: ['Test Unit 1'],
  streetAddresses: ['123 Main St'],
  countries: ['US'],
  localities: ['San Francisco'],
  provinces: ['CA'],
  postalCodes: ['12345'],
  serialNumber: '123456',
  certificateHash: '123456',
  publicKey:
    '-----BEGIN PUBLIC KEY-----\nMockPublicKey1\n-----END PUBLIC KEY----- ',
};

const mockCertificate2: ParsedCertificate = {
  name: 'Test Certificate 2',
  authority: 'Test Authority 2',
  expiresOn: new Date('2025-01-01'),
  altNames: ['test.com'],
  issuedOn: new Date('2024-01-01'),
  commonName: 'Test Certificate 2',
  organizations: ['Test Org 2'],
  localities: ['San Francisco'],
  provinces: ['CA'],
  organizationalUnits: ['Test Unit 2'],
  countries: ['US'],
  streetAddresses: ['123 Main St'],
  postalCodes: ['12345'],
  serialNumber: '789012',
  certificateHash: '123456',
  publicKey:
    '-----BEGIN PUBLIC KEY-----\nMockPublicKey2\n-----END PUBLIC KEY----- ',
};

// Common PEM certificate strings used across tests
const MOCK_PEM_CERT_1 =
  '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----';
const MOCK_PEM_CERT_2 =
  '-----BEGIN CERTIFICATE-----\nMockCert2\n-----END CERTIFICATE-----';
const MOCK_PEM_INVALID =
  '-----BEGIN CERTIFICATE-----\nInvalidCert\n-----END CERTIFICATE-----';
const MOCK_PEM_BUNDLE_CERT =
  '-----BEGIN CERTIFICATE-----\nBundleCert\n-----END CERTIFICATE-----';

describe('useParseBundleCertificates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when certificateBundles is empty', () => {
    const { result } = renderHook(() => useParseBundleCertificates([]));

    expect(result.current.parsedCertificates).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should parse a single certificate bundle successfully', async () => {
    const mockCertificateBundle = {
      'ca.crt': MOCK_PEM_CERT_1,
    };

    const certificateBundles: ZenkoCRCertificateBundle[] = [
      mockCertificateBundle,
    ];

    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_CERT_1,
        base64Cert: 'MockCert1',
      },
    ]);
    mockParseCertificateFromPEM.mockResolvedValue(mockCertificate1);

    const { result } = renderHook(() =>
      useParseBundleCertificates(certificateBundles),
    );

    // Should start loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.parsedCertificates).toEqual([
      [{ ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 }],
    ]);
    expect(mockExtractPemParts).toHaveBeenCalledWith(
      mockCertificateBundle['ca.crt'],
    );
    expect(mockParseCertificateFromPEM).toHaveBeenCalledWith(MOCK_PEM_CERT_1);
  });

  it('should parse multiple certificate bundles successfully', async () => {
    const mockCertificateBundle1 = {
      'ca.crt': MOCK_PEM_CERT_1,
    };
    const mockCertificateBundle2 = {
      'ca.crt': MOCK_PEM_CERT_2,
    };

    const certificateBundles: ZenkoCRCertificateBundle[] = [
      mockCertificateBundle1,
      mockCertificateBundle2,
    ];

    // Setup mocks - need to return different values for each call
    mockExtractPemParts
      .mockReturnValueOnce([
        {
          pem: MOCK_PEM_CERT_1,
          base64Cert: 'MockCert1',
        },
      ])
      .mockReturnValueOnce([
        {
          pem: MOCK_PEM_CERT_2,
          base64Cert: 'MockCert2',
        },
      ]);

    mockParseCertificateFromPEM
      .mockResolvedValueOnce(mockCertificate1)
      .mockResolvedValueOnce(mockCertificate2);

    const { result } = renderHook(() =>
      useParseBundleCertificates(certificateBundles),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.parsedCertificates).toEqual([
      [{ ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 }],
      [{ ...mockCertificate2, originalPEM: MOCK_PEM_CERT_2 }],
    ]);
  });

  it('should parse a bundle with multiple certificates (certificate chain)', async () => {
    const mockCertificateBundle = {
      'ca.crt': `${MOCK_PEM_CERT_1}\n${MOCK_PEM_CERT_2}`,
    };

    const certificateBundles: ZenkoCRCertificateBundle[] = [
      mockCertificateBundle,
    ];

    // Setup mocks - extractPemParts returns 2 certificates from 1 bundle
    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_CERT_1,
        base64Cert: 'MockCert1',
      },
      {
        pem: MOCK_PEM_CERT_2,
        base64Cert: 'MockCert2',
      },
    ]);

    mockParseCertificateFromPEM
      .mockResolvedValueOnce(mockCertificate1)
      .mockResolvedValueOnce(mockCertificate2);

    const { result } = renderHook(() =>
      useParseBundleCertificates(certificateBundles),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.parsedCertificates).toEqual([
      [
        { ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 },
        { ...mockCertificate2, originalPEM: MOCK_PEM_CERT_2 },
      ],
    ]);
  });

  it('should handle parsing errors', async () => {
    const mockCertificateBundle = {
      'ca.crt': MOCK_PEM_INVALID,
    };

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const certificateBundles: ZenkoCRCertificateBundle[] = [
      mockCertificateBundle,
    ];

    // Setup mocks to throw error
    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_INVALID,
        base64Cert: 'InvalidCert',
      },
    ]);
    mockParseCertificateFromPEM.mockRejectedValue(
      new Error('Invalid certificate format'),
    );

    const { result } = renderHook(() =>
      useParseBundleCertificates(certificateBundles),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.parsedCertificates).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error parsing certificates:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('useParseSecretCertificates', () => {
  it('should return empty array when extraCACerts is empty', () => {
    mockUseK8sSecretQueries.mockReturnValue({
      status: 'loading',
      data: undefined,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isIdle: false,
      isFetching: false,
      isFetched: false,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() => useParseSecretCertificates([]));

    expect(result.current.parsedSecretCertificates).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('should parse a single secret certificate successfully', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret',
        secretAttributes: 'ca.crt',
      },
    ];

    // Base64 encoded PEM certificate
    const base64Cert = Buffer.from(MOCK_PEM_CERT_1).toString('base64');

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            'ca.crt': base64Cert,
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_CERT_1,
        base64Cert: 'MockCert1',
      },
    ]);
    mockParseCertificateFromPEM.mockResolvedValue(mockCertificate1);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([
        [{ ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 }],
      ]);
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockExtractPemParts).toHaveBeenCalledWith(MOCK_PEM_CERT_1);
    expect(mockParseCertificateFromPEM).toHaveBeenCalledWith(MOCK_PEM_CERT_1);
  });

  it('should parse multiple secret certificates successfully', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret-1',
        secretAttributes: 'ca.crt',
      },
      {
        secretName: 'test-secret-2',
        secretAttributes: 'tls.crt',
      },
    ];

    const base64Cert1 = Buffer.from(MOCK_PEM_CERT_1).toString('base64');
    const base64Cert2 = Buffer.from(MOCK_PEM_CERT_2).toString('base64');

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            'ca.crt': base64Cert1,
          },
        },
        {
          data: {
            'tls.crt': base64Cert2,
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    mockExtractPemParts
      .mockReturnValueOnce([
        {
          pem: MOCK_PEM_CERT_1,
          base64Cert: 'MockCert1',
        },
      ])
      .mockReturnValueOnce([
        {
          pem: MOCK_PEM_CERT_2,
          base64Cert: 'MockCert2',
        },
      ]);

    mockParseCertificateFromPEM
      .mockResolvedValueOnce(mockCertificate1)
      .mockResolvedValueOnce(mockCertificate2);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([
        [{ ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 }],
        [{ ...mockCertificate2, originalPEM: MOCK_PEM_CERT_2 }],
      ]);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should use default secretAttributes (ca.crt) when not specified', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret',
        // secretAttributes not specified
      },
    ];

    const base64Cert = Buffer.from(MOCK_PEM_CERT_1).toString('base64');

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            'ca.crt': base64Cert, // Should use default 'ca.crt'
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_CERT_1,
        base64Cert: 'MockCert1',
      },
    ]);
    mockParseCertificateFromPEM.mockResolvedValue(mockCertificate1);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([
        [{ ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 }],
      ]);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should parse a secret with multiple certificates (certificate chain)', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret-chain',
        secretAttributes: 'ca.crt',
      },
    ];

    const certificatePEM = `${MOCK_PEM_CERT_1}\n${MOCK_PEM_CERT_2}`;
    const base64Cert = Buffer.from(certificatePEM).toString('base64');

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            'ca.crt': base64Cert,
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    // extractPemParts returns 2 certificates from 1 bundle
    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_CERT_1,
        base64Cert: 'MockCert1',
      },
      {
        pem: MOCK_PEM_CERT_2,
        base64Cert: 'MockCert2',
      },
    ]);

    mockParseCertificateFromPEM
      .mockResolvedValueOnce(mockCertificate1)
      .mockResolvedValueOnce(mockCertificate2);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([
        [
          { ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 },
          { ...mockCertificate2, originalPEM: MOCK_PEM_CERT_2 },
        ],
      ]);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle query loading state', () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret',
        secretAttributes: 'ca.crt',
      },
    ];

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'loading',
      data: undefined,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isIdle: false,
      isFetching: true,
      isFetched: false,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.parsedSecretCertificates).toEqual([]);
  });

  it('should handle query error state', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret',
        secretAttributes: 'ca.crt',
      },
    ];

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'error',
      data: undefined,
      error: new Error('Failed to fetch secret'),
      isLoading: false,
      isError: true,
      isSuccess: false,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([]);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle missing certificate in secret data', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret',
        secretAttributes: 'ca.crt',
      },
    ];

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            // Missing 'ca.crt' field
            'other-field': 'some-value',
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([]);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error parsing secret certificates:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle null or undefined secret data', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret',
        secretAttributes: 'ca.crt',
      },
    ];

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([]);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle certificate parsing errors', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        secretName: 'test-secret',
        secretAttributes: 'ca.crt',
      },
    ];

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const base64Cert = Buffer.from(MOCK_PEM_INVALID).toString('base64');

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            'ca.crt': base64Cert,
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_INVALID,
        base64Cert: 'InvalidCert',
      },
    ]);
    mockParseCertificateFromPEM.mockRejectedValue(
      new Error('Invalid certificate format'),
    );

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([]);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error parsing secret certificates:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should filter out bundles without secretName', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        'ca.crt': MOCK_PEM_CERT_1,
        // No secretName - should be filtered out
      },
      {
        secretName: 'test-secret',
        secretAttributes: 'ca.crt',
      },
    ];

    const base64Cert = Buffer.from(MOCK_PEM_CERT_1).toString('base64');

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            'ca.crt': base64Cert,
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    mockExtractPemParts.mockReturnValue([
      {
        pem: MOCK_PEM_CERT_1,
        base64Cert: 'MockCert1',
      },
    ]);
    mockParseCertificateFromPEM.mockResolvedValue(mockCertificate1);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([
        [{ ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 }],
      ]);
    });

    // Should only call useK8sSecretQueries with the one valid secret
    expect(mockUseK8sSecretQueries).toHaveBeenCalledWith(['test-secret']);
  });

  it('should handle mixed bundle and secret certificates', async () => {
    const extraCACerts: ZenkoCRCertificateBundle[] = [
      {
        'ca.crt': MOCK_PEM_BUNDLE_CERT,
        // This is a bundle certificate, not a secret
      },
      {
        secretName: 'test-secret-1',
        secretAttributes: 'ca.crt',
      },
      {
        secretName: 'test-secret-2',
        secretAttributes: 'tls.crt',
      },
    ];

    const base64Cert1 = Buffer.from(MOCK_PEM_CERT_1).toString('base64');
    const base64Cert2 = Buffer.from(MOCK_PEM_CERT_2).toString('base64');

    mockUseK8sSecretQueries.mockReturnValue({
      status: 'success',
      data: [
        {
          data: {
            'ca.crt': base64Cert1,
          },
        },
        {
          data: {
            'tls.crt': base64Cert2,
          },
        },
      ],
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isIdle: false,
      isFetching: false,
      isFetched: true,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      refetch: jest.fn(),
      remove: jest.fn(),
    } as any);

    mockExtractPemParts
      .mockReturnValueOnce([
        {
          pem: MOCK_PEM_CERT_1,
          base64Cert: 'MockCert1',
        },
      ])
      .mockReturnValueOnce([
        {
          pem: MOCK_PEM_CERT_2,
          base64Cert: 'MockCert2',
        },
      ]);

    mockParseCertificateFromPEM
      .mockResolvedValueOnce(mockCertificate1)
      .mockResolvedValueOnce(mockCertificate2);

    const { result } = renderHook(() =>
      useParseSecretCertificates(extraCACerts),
    );

    await waitFor(() => {
      expect(result.current.parsedSecretCertificates).toEqual([
        [{ ...mockCertificate1, originalPEM: MOCK_PEM_CERT_1 }],
        [{ ...mockCertificate2, originalPEM: MOCK_PEM_CERT_2 }],
      ]);
    });

    // Should only extract and query the secret certificates, not the bundle
    expect(mockUseK8sSecretQueries).toHaveBeenCalledWith([
      'test-secret-1',
      'test-secret-2',
    ]);
  });
});
