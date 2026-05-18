import makeMgtClient, { type UiFacingApiWrapper } from '../../../../js/managementClient';
import type { UserV1 } from '../../../../js/managementClient/api';
import type { Endpoint } from '../../../../types/config';
import type { WebIdentityRoles } from '../../../../types/iam';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import type { AccountInfo } from '../../domain/entities/account';
import type { IAccountsAdapter } from './IAccountsAdapter';
import type { IAccountsLocationsEndpointsAdapter } from './IAccountsLocationsEndpointsBundledAdapter';
import type { ILocationsAdapter, LocationInfo } from './ILocationsAdapter';

const SCALITY_INTERNAL_SERVICES = 'scality-internal-services';

export class VaultAccountsLocationsAdapter
  implements IAccountsAdapter, ILocationsAdapter, IAccountsLocationsEndpointsAdapter
{
  managementClient: UiFacingApiWrapper;
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
        const existing = accounts.find((a) => a.id === account.id);
        if (existing) {
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
    return this.managementClient.getConfigurationOverlayView(this.instanceId).then((overlay) => {
      return {
        accounts: notFalsyTypeGuard(overlay.users).map((user: UserV1) => ({
          id: notFalsyTypeGuard(user.id),
          name: user.userName,
          canonicalId: notFalsyTypeGuard(user.canonicalId),
          creationDate: new Date(notFalsyTypeGuard(user.createDate)),
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
