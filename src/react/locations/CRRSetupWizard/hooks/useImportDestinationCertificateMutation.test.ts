import type { ZenkoCR } from '../../../truststore/Truststore';
import { isCertificateAlreadyImported } from './useImportDestinationCertificateMutation';

const CERT = '-----BEGIN CERTIFICATE-----\ndest\n-----END CERTIFICATE-----';
const withCerts = (certs: string[]): ZenkoCR => ({
  spec: { egress: { extraCACerts: certs.map((c) => ({ 'ca.crt': c })) } },
});

describe('isCertificateAlreadyImported', () => {
  it('is false when the truststore has no egress configuration yet', () => {
    expect(isCertificateAlreadyImported(undefined, CERT)).toBe(false);
    expect(isCertificateAlreadyImported({ spec: {} }, CERT)).toBe(false);
  });

  it('is false when other certificates are present but not this one', () => {
    expect(isCertificateAlreadyImported(withCerts(['some-other-cert']), CERT)).toBe(false);
  });

  it('is true when the exact certificate is already in the truststore', () => {
    expect(isCertificateAlreadyImported(withCerts(['some-other-cert', CERT]), CERT)).toBe(true);
  });
});
