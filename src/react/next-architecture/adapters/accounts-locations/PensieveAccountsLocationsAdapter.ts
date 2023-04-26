import { UiFacingApi, UserV1 } from '../../../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { AccountInfo } from '../../domain/entities/account';
import { IAccountsAdapter } from './IAccountsAdapter';
import { ILocationsAdapter } from './ILocationsAdapter';
import makeMgtClient from '../../../../js/managementClient';
export class PensieveAccountsAdapter
  implements IAccountsAdapter, ILocationsAdapter
{
  managementClient: UiFacingApi;
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private token: string,
  ) {
    this.managementClient = makeMgtClient(this.baseUrl, this.token);
  }
  async listLocations(): Promise<void> {
    throw new Error('Method not implemented.');
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
