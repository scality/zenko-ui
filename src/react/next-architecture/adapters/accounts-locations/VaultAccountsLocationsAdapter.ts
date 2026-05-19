import makeMgtClient, { type UiFacingApiWrapper } from '../../../../js/managementClient';
import type { LocationV1 } from '../../../../js/managementClient/api';
import type { Endpoint } from '../../../../types/config';
import type { IAccountsLocationsEndpointsAdapter } from './IAccountsLocationsEndpointsBundledAdapter';
import type { ILocationsAdapter, LocationInfo } from './ILocationsAdapter';

const mapLocation = (location: LocationV1): LocationInfo => ({
  id: location.objectId || '',
  name: location.name,
  type: location.locationType,
  details: location.details || {},
  isTransient: location.isTransient,
  isCold: location.isCold,
});

const mapEndpoint = (endpoint: { hostname: string; locationName: string; isBuiltin?: boolean }): Endpoint => ({
  hostname: endpoint.hostname,
  locationName: endpoint.locationName,
  isBuiltin: !!endpoint.isBuiltin,
});

export class VaultAccountsLocationsAdapter
  implements ILocationsAdapter, IAccountsLocationsEndpointsAdapter
{
  private managementClient: UiFacingApiWrapper;
  constructor(
    private iamEndpoint: string,
    private getToken: () => Promise<string | null>,
    private managementBaseUrl: string,
    private instanceId: string,
  ) {
    this.managementClient = makeMgtClient(managementBaseUrl, 'NOT_YET_AUTHENTICATED');
  }

  async listAccountsLocationsAndEndpoints(): Promise<{
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }> {
    this.managementClient.setToken(await this.getToken());
    const overlay = await this.managementClient.getConfigurationOverlayView(this.instanceId);
    return {
      locations: Object.values(overlay.locations || {}).map(mapLocation),
      endpoints: (overlay.endpoints || []).map(mapEndpoint),
    };
  }

  async listLocations(): Promise<LocationInfo[]> {
    this.managementClient.setToken(await this.getToken());
    const config = await this.managementClient.getConfigurationOverlayView(this.instanceId);
    return Object.values(config.locations || {}).map(mapLocation);
  }
}
