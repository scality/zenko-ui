import {
  JAGUAR_S3_LOCATION_KEY,
  Locations,
  ORANGE_S3_LOCATION_KEY,
} from '../../../types/config';
import { getLocationTypeKey } from '../storageOptions';

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
    expect(getLocationTypeKey(location['orange-location'])).toBe(
      ORANGE_S3_LOCATION_KEY,
    );
  });
  it('should return Jaguar correct location key', () => {
    expect(getLocationTypeKey(location['jaguar-location'])).toBe(
      JAGUAR_S3_LOCATION_KEY,
    );
  });
  it('should return locationType from the object', () => {
    const locationKey1 = 'test';
    const locationKey2 = 'us-east-1';
    expect(getLocationTypeKey(location[locationKey1])).toBe(
      location[locationKey1].locationType,
    );
    expect(getLocationTypeKey(location[locationKey2])).toBe(
      location[locationKey2].locationType,
    );
  });
  it('should return empty string', () => {
    expect(getLocationTypeKey(location['wrong'])).toBe('');
  });
});
