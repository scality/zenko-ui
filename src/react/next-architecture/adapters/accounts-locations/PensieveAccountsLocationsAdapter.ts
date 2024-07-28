import makeMgtClient, {
  UiFacingApiWrapper,
} from '../../../../js/managementClient';
import { UserV1 } from '../../../../js/managementClient/api';
import { Endpoint } from '../../../../types/config';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { AccountInfo } from '../../domain/entities/account';
import { IAccountsAdapter } from './IAccountsAdapter';
import { IAccountsLocationsEndpointsAdapter } from './IAccountsLocationsEndpointsBundledAdapter';
import { ILocationsAdapter, LocationInfo } from './ILocationsAdapter';
export class PensieveAccountsLocationsAdapter
  implements
    IAccountsAdapter,
    ILocationsAdapter,
    IAccountsLocationsEndpointsAdapter
{
  managementClient: UiFacingApiWrapper;
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private getToken: () => Promise<string | null>,
  ) {
    this.managementClient = makeMgtClient(baseUrl, 'NOT_YET_AUTHENTICATED');
  }
  async listAccountsLocationsAndEndpoints(): Promise<{
    accounts: AccountInfo[];
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }> {
    this.managementClient.setToken(await this.getToken());
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
  async listLocations(): Promise<LocationInfo[]> {
    this.managementClient.setToken(await this.getToken());
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
    this.managementClient.setToken(await this.getToken());
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
