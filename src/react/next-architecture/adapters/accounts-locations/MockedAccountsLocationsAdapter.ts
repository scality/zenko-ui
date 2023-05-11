import {
  ACCOUNT,
  NEWLY_CREATED_ACCOUNT,
} from '../../../../js/mock/managementClientMSWHandlers';
import { AccountInfo } from '../../domain/entities/account';
import { DEFAULT_METRICS_MESURED_ON } from '../metrics/MockedMetricsAdapter';
import { IAccountsAdapter } from './IAccountsAdapter';
import { ILocationsAdapter } from './ILocationsAdapter';
export class MockedAccountsLocationsAdapter
  implements IAccountsAdapter, ILocationsAdapter
{
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
    ];
  });

  listAccounts = jest
    .fn()
    .mockImplementation(async (): Promise<AccountInfo[]> => {
      return [
        ACCOUNT,
        NEWLY_CREATED_ACCOUNT,
        {
          id: 'account-id-renard',
          name: 'Renard',
          canonicalId: 'canonical-id-renard',
          creationDate: DEFAULT_METRICS_MESURED_ON,
        },
        {
          id: 'account-without-location',
          name: 'Chat',
          canonicalId: 'canonical-id-renard-with-out-location',
          creationDate: DEFAULT_METRICS_MESURED_ON,
        },
      ];
    });
}
