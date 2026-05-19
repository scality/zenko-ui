import makeMgtClient, { type UiFacingApiWrapper } from '../../../../js/managementClient';
import type { Endpoint } from '../../../../types/config';
import type { ILocationsEndpointsAdapter } from './ILocationsEndpointsBundledAdapter';
import type { ILocationsAdapter, LocationInfo } from './ILocationsAdapter';

export class PensieveAccountsLocationsAdapter
  implements ILocationsAdapter, ILocationsEndpointsAdapter
{
  managementClient: UiFacingApiWrapper;
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private getToken: () => Promise<string | null>,
  ) {
    this.managementClient = makeMgtClient(baseUrl, 'NOT_YET_AUTHENTICATED');
  }
  async listLocationsAndEndpoints(): Promise<{
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }> {
    this.managementClient.setToken(await this.getToken());
    const overlay = await this.managementClient.getConfigurationOverlayView(this.instanceId);
    return {
      locations: Object.values(overlay.locations || {}).map((location) => ({
        id: location.objectId || '',
        name: location.name,
        type: location.locationType,
        details: location.details || {},
        isTransient: location.isTransient,
        isCold: location.isCold,
      })),
      endpoints: (overlay.endpoints || []).map((endpoint) => ({
        hostname: endpoint.hostname,
        locationName: endpoint.locationName,
        isBuiltin: !!endpoint.isBuiltin,
      })),
    };
  }
  async listLocations(): Promise<LocationInfo[]> {
    this.managementClient.setToken(await this.getToken());
    return (
      this.managementClient.getConfigurationOverlayView(this.instanceId).then((config) => {
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
}
