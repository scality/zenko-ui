import { Account } from './account';
import { AppConfig, InstanceId } from './entities';
import { BucketList, InstanceStatus } from './stats';
import { Hostname } from './config';
import { ErrorViewType } from './ui';
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
export type InstancesState = {
  readonly selectedId: InstanceId | null;
};
export type InstanceStatusState = {
  readonly latest: InstanceStatus;
};
export type NetworkActivityState = {
  readonly authFailure: boolean;
};
export type StatsState = {
  readonly bucketList: BucketList;
};
export type EndpointsUIState = {
  showDelete: Hostname;
};
export type AppState = {
  readonly auth: AuthState;
  readonly instances: InstancesState;
  readonly instanceStatus: InstanceStatusState;
  readonly networkActivity: NetworkActivityState;
  readonly uiErrors: ErrorsUIState;
  readonly uiEndpoints: EndpointsUIState;
  readonly stats: StatsState;
};
