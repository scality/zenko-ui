import { Account, AccountKey } from './account';
import { AppConfig, InstanceId } from './entities';
import { AuthUser, OidcLogoutFunction } from './auth';
import { BucketList, InstanceStatus } from './stats';
import { ConfigurationOverlay, Hostname } from './config';
import { ErrorViewType } from './ui';
import { IamAccessKey } from './user';
import { List } from 'immutable';
import { ManagementClient as ManagementClientInterface } from './managementClient';
import { STSClient } from './sts';
export type AuthState = {
  readonly isConfigLoaded: boolean;
  readonly isClientsLoaded: boolean;
  readonly configFailure: boolean;
  readonly managementClient: ManagementClientInterface;
  readonly stsClient: STSClient;
  readonly config: AppConfig;
  readonly selectedAccount: Account | null;
  readonly oidcLogout: OidcLogoutFunction | null;
};
export type OIDCState = {
  readonly user: AuthUser;
};
export type AssumeRoleParams = {
  readonly idToken: string;
  readonly roleArn: string;
  readonly RoleSessionName: string;
};
export type ErrorsUIState = {
  readonly errorMsg: string | null;
  readonly errorType: ErrorViewType | null;
};
export type ConfigurationState = {
  readonly latest: ConfigurationOverlay | null;
};
export type AccountState = {
  readonly display: Account;
  readonly accessKeyList: Array<IamAccessKey>;
};
export type InstancesState = {
  readonly selectedId: InstanceId | null;
};
export type InstanceStatusState = {
  readonly latest: InstanceStatus;
};
export type NetworkActivityState = {
  readonly counter: number;
  readonly authFailure: boolean;
  readonly messages: List<string>;
};
export type AccountsUIState = {
  readonly showDelete: boolean;
  readonly showKeyCreate: boolean;
};
export type StatsState = {
  readonly bucketList: BucketList;
};
export type SecretsState = {
  accountKey: AccountKey | null;
};
export type EndpointsUIState = {
  showDelete: Hostname;
};
export type AppState = {
  readonly account: AccountState;
  readonly auth: AuthState;
  readonly configuration: ConfigurationState;
  readonly instances: InstancesState;
  readonly instanceStatus: InstanceStatusState;
  readonly networkActivity: NetworkActivityState;
  readonly oidc: OIDCState;
  readonly secrets: SecretsState;
  readonly uiErrors: ErrorsUIState;
  readonly uiEndpoints: EndpointsUIState;
  readonly uiAccounts: AccountsUIState;
  readonly stats: StatsState;
};
