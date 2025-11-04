import { render, screen } from '@testing-library/react';
import { ParsedCertificate } from '@scality/certchain';
import CertificateDetails from '../CertificateDetails';
import { NewWrapper } from '../../utils/testUtil';

describe('CertificateDetails', () => {
  const mockCertificate: ParsedCertificate = {
    name: 'TEST CERTIFICATE NAME',
    authority: 'Test CA',
    commonName: 'TEST CERTIFICATE COMMON NAME',
    expiresOn: new Date('2025-12-31'),
    issuedOn: new Date('2024-01-01'),
    altNames: ['Test Certificate Alt Name', 'www.example.com'],
    organizations: ['Test Org'],
    organizationalUnits: ['IT Department'],
    countries: ['US'],
    localities: ['San Francisco'],
    provinces: ['CA'],
    streetAddresses: ['123 Main St'],
    postalCodes: ['94102'],
    serialNumber: '1234567890',
    certificateHash: 'abc123',
    publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
  };

  const mockRootCertificate: ParsedCertificate = {
    ...mockCertificate,
    name: 'Root CA',
    authority: 'Root CA',
  };

  const handleClose = jest.fn();

  beforeEach(() => {
    handleClose.mockClear();
  });

  it('should render modal when open with certificate data', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    expect(screen.getByText('Certificate Details')).toBeInTheDocument();
    expect(
      screen.getByText('TEST CERTIFICATE COMMON NAME'),
    ).toBeInTheDocument();
    expect(screen.getByText('Test CA')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={false}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    expect(screen.queryByText('Certificate Details')).not.toBeInTheDocument();
  });

  it('should display all certificate fields correctly', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    // Check labels
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Authority')).toBeInTheDocument();
    expect(screen.getByText('Expires on')).toBeInTheDocument();
    expect(screen.getByText('Common Name (CN)')).toBeInTheDocument();
    expect(screen.getByText('Organization (O)')).toBeInTheDocument();

    // Check values
    expect(screen.getByText('Test Org')).toBeInTheDocument();
    expect(screen.getByText('IT Department')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('94102')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });

  it('should display multiple altNames', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    expect(screen.getByText('Test Certificate Alt Name')).toBeInTheDocument();
    expect(screen.getByText('www.example.com')).toBeInTheDocument();
  });

  it('should display "Not set" for empty fields', () => {
    const certificateWithEmptyFields: ParsedCertificate = {
      ...mockCertificate,
      commonName: '',
      organizations: [],
      organizationalUnits: [],
      countries: [],
      localities: [],
      provinces: [],
      streetAddresses: [],
      postalCodes: [],
      serialNumber: '',
    };

    render(
      <CertificateDetails
        selectedCertificate={[certificateWithEmptyFields]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements.length).toBeGreaterThan(0);
  });

  it('should render multiple certificates in chain', () => {
    const intermediateCert: ParsedCertificate = {
      ...mockCertificate,
      name: 'Intermediate CA',
      authority: 'Root CA',
      altNames: ['Test Intermediate Certificate Alt Name', 'www.example.com'],
    };

    render(
      <CertificateDetails
        selectedCertificate={[intermediateCert, mockRootCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    // www.example.com appears multiple times in both certificates
    expect(
      screen.getByText('Test Intermediate Certificate Alt Name'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('www.example.com').length).toEqual(2);

    expect(screen.getAllByText(/Root CA/i).length).toEqual(4); // Title + name + 2 authority
    expect(screen.getByText('Root CA (Root certificate)')).toBeInTheDocument();
    expect(screen.queryAllByText('Intermediate CA').length).toEqual(2); // Title + name
  });

  it('should format date correctly', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    // Date formatting depends on locale, but should contain year
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('should display "Not set" for null commonName', () => {
    const certificateWithNullCommonName: ParsedCertificate = {
      ...mockCertificate,
      commonName: null as any,
    };

    render(
      <CertificateDetails
        selectedCertificate={[certificateWithNullCommonName]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements.length).toBeGreaterThan(0);
  });

  it('should display all certificate field labels', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    // Check all field labels are present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Authority')).toBeInTheDocument();
    expect(screen.getByText('Expires on')).toBeInTheDocument();
    expect(screen.getByText('Altname(s)')).toBeInTheDocument();
    expect(screen.getByText('Common Name (CN)')).toBeInTheDocument();
    expect(screen.getByText('Organization (O)')).toBeInTheDocument();
    expect(screen.getByText('Org unit (OU)')).toBeInTheDocument();
    expect(screen.getByText('Locality (L)')).toBeInTheDocument();
    expect(screen.getByText('Countries (C)')).toBeInTheDocument();
    expect(screen.getByText('State (ST)')).toBeInTheDocument();
    expect(screen.getByText('Street Address (STREET)')).toBeInTheDocument();
    expect(screen.getByText('Postal Code (PC)')).toBeInTheDocument();
    expect(screen.getByText('Serial Number (SN)')).toBeInTheDocument();
  });

  it('should handle arrays with empty string elements', () => {
    const certificateWithEmptyArrayElements: ParsedCertificate = {
      ...mockCertificate,
      organizations: ['Test Org', ''],
      localities: ['', 'San Francisco'],
    };

    render(
      <CertificateDetails
        selectedCertificate={[certificateWithEmptyArrayElements]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    // Should show "Not set" for empty array elements
    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements.length).toBeGreaterThan(0);

    // But still show valid values
    expect(screen.getByText('Test Org')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
  });
});
