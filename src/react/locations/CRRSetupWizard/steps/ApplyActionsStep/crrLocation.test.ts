import type { SetupResult } from '../../api/types';
import { buildCRRLocation, buildCRRLocationName, buildCRRReplicationRuleId, crrStsEndpoint } from './crrLocation';

describe('buildCRRLocationName', () => {
  it('reduces the base domain to a name-safe host', () => {
    expect(buildCRRLocationName({ destinationAccountName: 'dest-acct', baseDomain: 'crr-dest.artesca.local' })).toBe(
      'location-dest-acct-crr-dest-artesca-local',
    );
  });
});

describe('buildCRRReplicationRuleId', () => {
  it('names the rule after the destination account', () => {
    expect(buildCRRReplicationRuleId('dest-acct')).toBe('replication-dest-acct');
  });
});

describe('crrStsEndpoint', () => {
  it('derives the Host-based sts.<base> endpoint from the base domain', () => {
    expect(crrStsEndpoint('crr-dest.artesca.local')).toBe('https://sts.crr-dest.artesca.local');
  });
});

describe('buildCRRLocation', () => {
  const result: SetupResult = {
    endpoint: 'https://s3.crr-dest.artesca.local',
    stsEndpoint: 'https://ui.crr-dest.artesca.local/zenko/sts',
    accessKey: 'AKIA',
    secretKey: 'secret',
    roleArn: 'arn:aws:iam::123456789012:role/crr-role',
  };

  it('uses the picked S3 endpoint + keys from the result, but the STS endpoint derived from the base domain', () => {
    expect(buildCRRLocation('dest-acct-crr-dest', result, 'crr-dest.artesca.local')).toEqual({
      name: 'dest-acct-crr-dest',
      locationType: 'location-scality-crr-v1',
      details: {
        endpoint: 'https://s3.crr-dest.artesca.local',
        stsEndpoint: 'https://sts.crr-dest.artesca.local',
        accessKey: 'AKIA',
        secretKey: 'secret',
      },
    });
  });
});
