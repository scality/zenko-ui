import { configureResolver, type ConfigureFormValues, defaultConfigureValues, toStartSetupBody } from './schema';

const VALUES: ConfigureFormValues = {
  ...defaultConfigureValues,
  baseDomain: 'crr-dest.artesca.local',
  username: 'scality',
  password: 'super-secret',
  certificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
  selectedEndpoint: 's3.crr-dest.artesca.local',
};

describe('toStartSetupBody — destination account name', () => {
  it('keeps the name of an existing destination account unchanged', () => {
    const body = toStartSetupBody({
      ...VALUES,
      destinationAccountNameType: 'existing',
      destinationAccountName: 'finance ',
    });

    expect(body.destinationAccount).toEqual({ mode: 'existing', name: 'finance ' });
  });

  it('trims the name of a destination account to create', () => {
    const body = toStartSetupBody({
      ...VALUES,
      destinationAccountNameType: 'create',
      destinationAccountName: '  finance ',
    });

    expect(body.destinationAccount).toEqual({ mode: 'create', name: 'finance' });
  });
});

describe('toStartSetupBody — source Object Lock', () => {
  it('flags a locked source when a replication rule is requested', () => {
    const body = toStartSetupBody({ ...VALUES, createReplicationRule: true, sourceObjectLockEnabled: true });

    expect(body.sourceObjectLockEnabled).toBe(true);
  });

  it.each([false, null])('omits the flag when the source Object Lock is %s', (sourceObjectLockEnabled) => {
    const body = toStartSetupBody({ ...VALUES, createReplicationRule: true, sourceObjectLockEnabled });

    expect(body).not.toHaveProperty('sourceObjectLockEnabled');
  });

  it('omits the flag when no replication rule is requested', () => {
    const body = toStartSetupBody({ ...VALUES, createReplicationRule: false, sourceObjectLockEnabled: true });

    expect(body).not.toHaveProperty('sourceObjectLockEnabled');
  });
});

describe('configureResolver — source Object Lock', () => {
  it.each([true, false, null])('accepts sourceObjectLockEnabled %s', async (sourceObjectLockEnabled) => {
    const result = await configureResolver({ ...VALUES, sourceObjectLockEnabled }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });

    expect(JSON.stringify(result.errors)).not.toContain('sourceObjectLockEnabled');
  });
});
