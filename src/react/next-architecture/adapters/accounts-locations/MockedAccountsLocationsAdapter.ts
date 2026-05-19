import type { IAccountsLocationsEndpointsAdapter } from './IAccountsLocationsEndpointsBundledAdapter';
import type { ILocationsAdapter } from './ILocationsAdapter';
export class MockedAccountsLocationsAdapter
  implements ILocationsAdapter, IAccountsLocationsEndpointsAdapter
{
  listAccountsLocationsAndEndpoints = jest.fn().mockImplementation(async () => {
    return {
      locations: await this.listLocations(),
      endpoints: [
        {
          hostname: 's3.pod-choco.local',
          isBuiltin: false,
          locationName: 'us-east-1',
        },
        {
          hostname: 'zenko-cloudserver-replicator',
          isBuiltin: true,
          locationName: 'us-east-1',
        },
      ],
    };
  });
  listLocations = jest.fn().mockImplementation(async () => {
    return [
      {
        id: 'artesca-s3-location',
        name: 'artesca-s3-location',
        type: 'location-scality-artesca-s3-v1',
        details: {
          accessKey: 'xxx-access-key',
          secretKey: 'yyy-secret-key',
          bucketName: 'test-s3-bucket',
          endpoint: 'https://s3.scality.com',
          region: 'us-east-1',
        },
      },
      {
        id: 'artesca-jaguar-location',
        name: 'artesca-jaguar-location',
        type: 'location-jaguar-ring-s3-v1',
        details: {
          accessKey: 'xxx-access-key',
          secretKey: 'yyy-secret-key',
          bucketName: 'test-s3-bucket',
          endpoint: 'https://s3.scality.com',
          region: 'us-east-1',
        },
      },
      {
        isBuiltin: true,
        type: 'location-file-v1',
        name: 'us-east-1',
        id: '95dbedf5-9888-11ec-8565-1ac2af7d1e53',
        details: {
          bootstrapList: ['artesca-storage-service-hdservice-proxy.xcore.svc:18888'],
        },
      },
    ];
  });
}
