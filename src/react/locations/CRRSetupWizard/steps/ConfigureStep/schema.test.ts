import { type ConfigureFormValues, defaultConfigureValues, toStartSetupBody } from './schema';

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
