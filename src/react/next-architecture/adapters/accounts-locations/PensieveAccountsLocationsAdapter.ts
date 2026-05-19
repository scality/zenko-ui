import makeMgtClient, { type UiFacingApiWrapper } from '../../../../js/managementClient';
import type { ILocationsAdapter, LocationInfo } from './ILocationsAdapter';
export class PensieveAccountsLocationsAdapter implements ILocationsAdapter {
  managementClient: UiFacingApiWrapper;
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private getToken: () => Promise<string | null>,
  ) {
    this.managementClient = makeMgtClient(baseUrl, 'NOT_YET_AUTHENTICATED');
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
