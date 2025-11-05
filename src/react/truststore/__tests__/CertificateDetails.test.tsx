import { render, screen } from '@testing-library/react';
import { ParsedCertificate } from '@scality/certchain';
import CertificateDetails from '../CertificateDetails';
import { NewWrapper } from '../../utils/testUtil';

const now = new Date();
describe('CertificateDetails', () => {
  const mockCertificate: ParsedCertificate = {
    name: 'TEST CERTIFICATE NAME',
    authority: 'Test CA',
    commonName: 'TEST CERTIFICATE COMMON NAME',
    expiresOn: new Date('2026-10-05T00:00:00Z'),
    issuedOn: new Date('2025-10-05T00:00:00Z'),
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
    rsaPublicKey: {
      modulus: '1234567890',
      exponent: '01 00 01',
    },
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
    expect(
      screen.getByRole('button', {
        name: /Download TEST CERTIFICATE NAME certificate/i,
      }),
    ).toBeInTheDocument();
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
    expect(screen.getByText('Common Name')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Issued On')).toBeInTheDocument();
    expect(screen.getByText('Expires On')).toBeInTheDocument();
    expect(screen.getByText('Certificate')).toBeInTheDocument();
    expect(screen.getByText('Public Key')).toBeInTheDocument();

    // Check values
    expect(screen.getAllByText('TEST CERTIFICATE NAME').length).toEqual(2); // Name field value + Title field value
    expect(screen.getByText('Test CA')).toBeInTheDocument();
    expect(
      screen.getByText('TEST CERTIFICATE COMMON NAME'),
    ).toBeInTheDocument();
    expect(screen.getByText('Test Org')).toBeInTheDocument();
  });

  it('should display copy buttons for certificate hash and public key', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    // Copy buttons should be present for copyable fields
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThanOrEqual(2); // At least 2 for Certificate and Public Key
  });

  it('should display "Not set" for empty fields', () => {
    const certificateWithEmptyFields: ParsedCertificate = {
      ...mockCertificate,
      commonName: '',
      organizations: [],
      certificateHash: '',
      publicKey: '',
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
    expect(notSetElements.length).toBeGreaterThanOrEqual(4); // commonName, organizations, certificateHash, publicKey
  });

  it('should render multiple certificates in chain', () => {
    const intermediateCert: ParsedCertificate = {
      ...mockCertificate,
      name: 'Intermediate CA',
      authority: 'Root CA',
    };

    render(
      <CertificateDetails
        selectedCertificate={[intermediateCert, mockRootCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    // Check both certificates are displayed
    expect(screen.getByText('Root CA (Root certificate)')).toBeInTheDocument();
    expect(screen.queryAllByText('Intermediate CA').length).toEqual(2); // Title + Name field value

    // Root CA appears multiple times: title, name field, authority field for intermediate
    const rootCAElements = screen.getAllByText(/Root CA/i);
    expect(rootCAElements.length).toBeGreaterThanOrEqual(3);
  });

  it('should display date fields', () => {
    render(
      <CertificateDetails
        selectedCertificate={[mockCertificate]}
        isModalOpen={true}
        handleClose={handleClose}
      />,
      { wrapper: NewWrapper() },
    );

    expect(screen.getByText('Expires On')).toBeInTheDocument();
    expect(screen.getByText('Issued On')).toBeInTheDocument();
    expect(screen.getByText(/- 2026-10-05/i)).toBeInTheDocument();
    expect(screen.getByText('2025-10-05')).toBeInTheDocument();
  });

  it('should handle arrays with empty string elements', () => {
    const certificateWithEmptyArrayElements: ParsedCertificate = {
      ...mockCertificate,
      organizations: ['Test Org', ''],
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
  });
});
