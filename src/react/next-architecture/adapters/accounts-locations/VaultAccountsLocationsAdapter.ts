import makeMgtClient, { type UiFacingApiWrapper } from '../../../../js/managementClient';
import type { LocationV1 } from '../../../../js/managementClient/api';
import type { Endpoint } from '../../../../types/config';
import type { WebIdentityRoles } from '../../../../types/iam';
import type { AccountInfo } from '../../domain/entities/account';
import type { IAccountsAdapter } from './IAccountsAdapter';
import type { IAccountsLocationsEndpointsAdapter } from './IAccountsLocationsEndpointsBundledAdapter';
import type { ILocationsAdapter, LocationInfo } from './ILocationsAdapter';

const SCALITY_INTERNAL_SERVICES = 'scality-internal-services';

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
  implements IAccountsAdapter, ILocationsAdapter, IAccountsLocationsEndpointsAdapter
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

  async listAccounts(): Promise<AccountInfo[]> {
    const token = await this.getToken();
    const accounts: AccountInfo[] = [];
    let marker: string | undefined = undefined;
    let isTruncated = true;

    while (isTruncated) {
      const url = new URL(`${this.iamEndpoint}/`);
      url.searchParams.set('Action', 'GetRolesForWebIdentity');
      if (marker) {
        url.searchParams.set('Marker', marker);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
      }

      const data: WebIdentityRoles = await response.json();

      for (const account of data.Accounts) {
        if (account.Name === SCALITY_INTERNAL_SERVICES) {
          continue;
        }
        if (accounts.some((a) => a.id === account.id)) {
          continue;
        }
        accounts.push({
          id: account.id,
          name: account.Name,
          canonicalId: account.canonicalId,
          creationDate: new Date(account.CreationDate),
        });
      }

      isTruncated = data.IsTruncated;
      marker = data.Marker;
    }

    return accounts;
  }

  async listAccountsLocationsAndEndpoints(): Promise<{
    accounts: AccountInfo[];
    locations: LocationInfo[];
    endpoints: Endpoint[];
  }> {
    this.managementClient.setToken(await this.getToken());
    const overlay = await this.managementClient.getConfigurationOverlayView(this.instanceId);
    return {
      accounts: [],
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
