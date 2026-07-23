import type { SetupResult } from '../../api/types';
import { buildCRRLocation, buildCRRLocationName } from './crrLocation';

describe('buildCRRLocationName', () => {
  it('uses the destination host from the connection URL, without scheme or port (management-network)', () => {
    expect(buildCRRLocationName({ destinationAccountName: 'dest-acct', url: 'https://10.0.0.42:8443' })).toBe(
      'dest-acct-10-0-0-42',
    );
  });

  it('uses the base domain host (data-network)', () => {
    expect(buildCRRLocationName({ destinationAccountName: 'dest-acct', baseDomain: 's3.example.com' })).toBe(
      'dest-acct-s3-example-com',
    );
  });
});

describe('buildCRRLocation', () => {
  const result: SetupResult = {
    endpoint: 'https://10.0.0.42:8443',
    stsEndpoint: 'https://10.0.0.42:8443/sts',
    accessKey: 'AKIA',
    secretKey: 'secret',
    roleArn: 'arn:aws:iam::123456789012:role/crr-role',
  };

  it('builds a location-scality-crr-v1 with the destination endpoints and crr-user keys from the setup result', () => {
    expect(buildCRRLocation('dest-acct-10-0-0-42', result)).toEqual({
      name: 'dest-acct-10-0-0-42',
      locationType: 'location-scality-crr-v1',
      details: {
        endpoint: 'https://10.0.0.42:8443',
        stsEndpoint: 'https://10.0.0.42:8443/sts',
        accessKey: 'AKIA',
        secretKey: 'secret',
      },
    });
  });
});
