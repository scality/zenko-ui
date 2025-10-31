import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useParseBundleCertificates, ZenkoCRCertificateBundle } from '../hooks';
import type { Certificate, CertificateSubject } from '@scality/certchain';

// Mock @scality/certchain module
jest.mock('@scality/certchain');

// Import mocked functions after mocking
import { parseCertificateFromPEM, extractPemParts } from '@scality/certchain';

const mockParseCertificateFromPEM =
  parseCertificateFromPEM as jest.MockedFunction<
    typeof parseCertificateFromPEM
  >;
const mockExtractPemParts = extractPemParts as jest.MockedFunction<
  typeof extractPemParts
>;

const mockCertificate1: Certificate & CertificateSubject = {
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

const mockCertificate2: Certificate & CertificateSubject = {
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
      'ca.crt':
        '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----',
    };

    const certificateBundles: ZenkoCRCertificateBundle[] = [
      mockCertificateBundle,
    ];

    mockExtractPemParts.mockReturnValue([
      {
        pem: '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----',
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

    expect(result.current.parsedCertificates).toEqual([[mockCertificate1]]);
    expect(mockExtractPemParts).toHaveBeenCalledWith(
      mockCertificateBundle['ca.crt'],
    );
    expect(mockParseCertificateFromPEM).toHaveBeenCalledWith(
      '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----',
    );
  });

  it('should parse multiple certificate bundles successfully', async () => {
    const mockCertificateBundle1 = {
      'ca.crt':
        '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----',
    };
    const mockCertificateBundle2 = {
      'ca.crt':
        '-----BEGIN CERTIFICATE-----\nMockCert2\n-----END CERTIFICATE-----',
    };

    const certificateBundles: ZenkoCRCertificateBundle[] = [
      mockCertificateBundle1,
      mockCertificateBundle2,
    ];

    // Setup mocks - need to return different values for each call
    mockExtractPemParts
      .mockReturnValueOnce([
        {
          pem: '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----',
          base64Cert: 'MockCert1',
        },
      ])
      .mockReturnValueOnce([
        {
          pem: '-----BEGIN CERTIFICATE-----\nMockCert2\n-----END CERTIFICATE-----',
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
      [mockCertificate1],
      [mockCertificate2],
    ]);
  });

  it('should parse a bundle with multiple certificates (certificate chain)', async () => {
    const mockCertificateBundle = {
      'ca.crt':
        '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\nMockCert2\n-----END CERTIFICATE-----',
    };

    const certificateBundles: ZenkoCRCertificateBundle[] = [
      mockCertificateBundle,
    ];

    // Setup mocks - extractPemParts returns 2 certificates from 1 bundle
    mockExtractPemParts.mockReturnValue([
      {
        pem: '-----BEGIN CERTIFICATE-----\nMockCert1\n-----END CERTIFICATE-----',
        base64Cert: 'MockCert1',
      },
      {
        pem: '-----BEGIN CERTIFICATE-----\nMockCert2\n-----END CERTIFICATE-----',
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
      [mockCertificate1, mockCertificate2],
    ]);
  });

  it('should handle parsing errors', async () => {
    const mockCertificateBundle = {
      'ca.crt':
        '-----BEGIN CERTIFICATE-----\nInvalidCert\n-----END CERTIFICATE-----',
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
        pem: '-----BEGIN CERTIFICATE-----\nInvalidCert\n-----END CERTIFICATE-----',
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
