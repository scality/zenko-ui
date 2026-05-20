import { LocationType } from '../../../js/managementClient/api';
import { storageOptions } from '../../locations/LocationDetails';
import { JAGUAR_S3_LOCATION_KEY, type Locations, ORANGE_S3_LOCATION_KEY } from '../../../types/config';
import { getLocationTypeKey, selectStorageOptions, selectStorageOptionsGrouped } from '../storageOptions';

const location: Locations = {
  //@ts-expect-error fix this when you are working on it
  'jaguar-location': {
    details: {
      accessKey: 'D338ZM9Z2LR0MXPN7DLE',
      bootstrapList: [],
      bucketName: 'jaguar-demo',
      endpoint: 'https://s3.fr-lyo.jaguar-network.com',
      region: 'us-east-1',
      secretKey: 'secret',
    },
    locationType: 'location-scality-ring-s3-v1',
    name: 'jaguar-location',
    objectId: '236ed00b-f6ed-11ec-8688-8e86d90d7766',
  },
  //@ts-expect-error fix this when you are working on it
  'orange-location': {
    details: {
      accessKey: 'D338ZM9Z2LR0MXPN7',
      bootstrapList: [],
      bucketName: 'orange-demo',
      endpoint: 'https://cloud.orange-business.com',
      region: 'us-east-1',
      secretKey: 'secret',
    },
    locationType: 'location-scality-ring-s3-v1',
    name: 'jaguar-location',
    objectId: '236ed00b-f6ed-11ec-8688-8e86d90d7766',
  },
  //@ts-expect-error fix this when you are working on it
  test: {
    details: {
      accessKey: '51O0SC8866YD7AF15RLT',
      bootstrapList: [],
      bucketName: 'patrick-replication',
      endpoint: 'http://s3.thomas.com',
      region: 'us-east-1',
      secretKey: 'secret',
    },
    locationType: 'location-scality-artesca-s3-v1',
    name: 'test',
    objectId: 'c73dbf58-f2d7-11ec-9298-de91f9715175',
  },
  //@ts-expect-error fix this when you are working on it
  'us-east-1': {
    details: {
      bootstrapList: [],
    },
    locationType: 'location-file-v1',
    name: 'us-east-1',
    objectId: '05b1eca4-ebde-11ec-b3c4-6e8ef4910691',
  },
};

describe('test getLocationTypeKey', () => {
  it('should return Orange correct location key', () => {
    expect(getLocationTypeKey(location['orange-location'])).toBe(ORANGE_S3_LOCATION_KEY);
  });
  it('should return Jaguar correct location key', () => {
    expect(getLocationTypeKey(location['jaguar-location'])).toBe(JAGUAR_S3_LOCATION_KEY);
  });
  it('should return locationType from the object', () => {
    const locationKey1 = 'test';
    const locationKey2 = 'us-east-1';
    expect(getLocationTypeKey(location[locationKey1])).toBe(location[locationKey1].locationType);
    expect(getLocationTypeKey(location[locationKey2])).toBe(location[locationKey2].locationType);
  });
  it('should return empty string', () => {
    expect(getLocationTypeKey(location['wrong'])).toBe('');
  });
});

describe('selectStorageOptions', () => {
  it('excludes options marked hidden by default', () => {
    const hiddenKey = Object.keys(storageOptions).find((k) => storageOptions[k].hidden);
    if (!hiddenKey) throw new Error('Test fixtures lost their hidden option');
    const result = selectStorageOptions({} as never, []);
    expect(result.find((o) => o.value === hiddenKey)).toBeUndefined();
  });

  it('includes hidden options when exceptHidden=false', () => {
    const hiddenKey = Object.keys(storageOptions).find((k) => storageOptions[k].hidden);
    if (!hiddenKey) throw new Error('Test fixtures lost their hidden option');
    const result = selectStorageOptions({} as never, [], undefined, false);
    expect(result.find((o) => o.value === hiddenKey)).toBeDefined();
  });

  it('hides the HDClient option when one is already created', () => {
    const result = selectStorageOptions({} as never, [
      // biome-ignore lint/suspicious/noExplicitAny: minimal stub
      { type: LocationType.ScalityHdclientV2 } as any,
    ]);
    expect(result.find((o) => o.value === 'location-scality-hdclient-v2')).toBeUndefined();
  });

  it('marks an option disabled when its required capability is missing', () => {
    const key = Object.keys(storageOptions).find((k) => storageOptions[k].checkCapability);
    if (!key) throw new Error('Test fixtures lost the checkCapability option');
    const result = selectStorageOptions({} as never, []);
    expect(result.find((o) => o.value === key)?.disabled).toBe(true);
  });

  it('marks an option enabled when its required capability is present', () => {
    const key = Object.keys(storageOptions).find((k) => storageOptions[k].checkCapability);
    if (!key) throw new Error('Test fixtures lost the checkCapability option');
    const cap = storageOptions[key].checkCapability as string;
    // biome-ignore lint/suspicious/noExplicitAny: minimal stub for the capability map
    const result = selectStorageOptions({ [cap]: true } as any, []);
    expect(result.find((o) => o.value === key)?.disabled).toBe(false);
  });
});

describe('selectStorageOptionsGrouped', () => {
  it('groups options into categories following categoryOrder', () => {
    const result = selectStorageOptionsGrouped({} as never, []);
    expect(result.map((g) => g.label)).toEqual([
      'CRR Location',
      'Scality S3 Locations',
      'Public Cloud Locations',
      'Cold Storage Locations',
      'On Prem Locations',
    ]);
  });

  it('never produces an empty category group', () => {
    const result = selectStorageOptionsGrouped({} as never, []);
    result.forEach((g) => expect(g.options.length).toBeGreaterThan(0));
  });
});
