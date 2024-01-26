import { UiFacingApi, UserV1 } from '../../../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { AccountInfo } from '../../domain/entities/account';
import { IAccountsAdapter } from './IAccountsAdapter';
import { ILocationsAdapter, LocationInfo } from './ILocationsAdapter';
import makeMgtClient from '../../../../js/managementClient';
import { IAccountsLocationsEndpointsAdapter } from './IAccountsLocationsEndpointsBundledAdapter';
import { Endpoint } from '../../../../types/config';
export class PensieveAccountsLocationsAdapter
  implements
    IAccountsAdapter,
    ILocationsAdapter,
    IAccountsLocationsEndpointsAdapter
{
  managementClient: UiFacingApi;
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private token: string,
  ) {
    this.managementClient = makeMgtClient(baseUrl, token);
  }
  listAccountsLocationsAndEndpoints(): Promise<{
    accounts: AccountInfo[];
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }> {
    return this.managementClient
      .getConfigurationOverlayView(this.instanceId)
      .then((overlay) => {
        return {
          accounts: notFalsyTypeGuard(overlay.users).map((user: UserV1) => ({
            id: notFalsyTypeGuard(user.id),
            name: user.userName,
            canonicalId: notFalsyTypeGuard(user.canonicalId),
            creationDate: notFalsyTypeGuard(user.createDate),
          })),
          locations: Object.values(overlay.locations || {}).map((location) => ({
            id: location.objectId || '',
            name: location.name,
            type: location.locationType,
            details: location.details || {},
            isTransient: location.isTransient,
            isCold: location.isCold,
          })),
          endpoints: (overlay.endpoints || []).map((endpoint) => {
            return {
              hostname: endpoint.hostname,
              locationName: endpoint.locationName,
              isBuiltin: !!endpoint.isBuiltin,
            };
          }),
        };
      });
  }
  listLocations(): Promise<LocationInfo[]> {
    //@ts-expect-error fix this when you are working on it
    return (
      this.managementClient
        .getConfigurationOverlayView(this.instanceId)
        .then((config) => {
          return Object.values(config.locations || {}).map((location) => ({
            id: location.objectId || '',
            name: location.name,
            type: location.locationType,
            details: location.details || {},
            isTransient: location.isTransient,
            isCold: location.isCold,
          }));
        }) || []
    );
  }
  async listAccounts(): Promise<AccountInfo[]> {
    return this.managementClient
      .getConfigurationOverlayView(this.instanceId)
      .then((overlay) => {
        return notFalsyTypeGuard(overlay.users).map((user: UserV1) => {
          return {
            id: notFalsyTypeGuard(user.id),
            name: user.userName,
            canonicalId: notFalsyTypeGuard(user.canonicalId),
            creationDate: notFalsyTypeGuard(user.createDate),
          };
        });
      });
  }
}
