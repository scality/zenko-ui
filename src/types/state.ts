import type { Account, AccountKey } from './account';
import type { AppConfig, InstanceId } from './entities';
import type { AuthUser, OidcLogoutFunction } from './auth';
import type {
  BucketInfo,
  ListObjectsType,
  ObjectEntity,
  ObjectMetadata,
  S3BucketList,
} from './s3';
import type { BucketList, InstanceStatus } from './stats';
import type {
  ConfigurationOverlay,
  Hostname,
  LocationName,
  ReplicationStreams,
} from './config';
import type { Marker, ZenkoClient as ZenkoClientInterface } from './zenko';
import type { ErrorViewType } from './ui';
import type { IamAccessKey } from './user';
import { List } from 'immutable';
import type { ManagementClient as ManagementClientInterface } from './managementClient';
import type { STSClient } from './sts';
import type { Workflows } from './workflow';
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
export type BucketsUIState = {
  readonly showDelete: string;
};
export type ObjectsUIState = {
  readonly showFolderCreate: boolean;
  readonly showObjectUpload: boolean;
  readonly showObjectDelete: boolean;
};
export type LocationsUIState = {
  readonly showDeleteLocation: LocationName;
};
export type StatsState = {
  readonly bucketList: BucketList;
};
export type S3State = {
  readonly listBucketsResults: {
    readonly list: S3BucketList;
    readonly ownerName: string;
  };
  readonly bucketInfo: BucketInfo | null;
  readonly listObjectsResults: {
    readonly list: List<ObjectEntity>;
    readonly nextMarker: Marker;
    readonly nextVersionIdMarker: Marker;
  };
  readonly listObjectsType: ListObjectsType;
  readonly objectMetadata: ObjectMetadata | null;
};
export type SecretsState = {
  accountKey: AccountKey | null;
};
export type WorkflowState = {
  list: Workflows;
  replications: ReplicationStreams;
};
export type WorkflowsUIState = {
  showEditWorkflowNotification: boolean;
  showWorkflowDeleteModal: boolean;
};
export type ZenkoState = {
  readonly zenkoClient: ZenkoClientInterface;
  readonly error: {
    readonly message: null | string;
    readonly code: null | string | number;
    readonly target: null | string;
    readonly type: string | null;
  };
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
  readonly uiLocations: LocationsUIState;
  readonly uiEndpoints: EndpointsUIState;
  readonly uiAccounts: AccountsUIState;
  readonly uiBuckets: BucketsUIState;
  readonly uiObjects: ObjectsUIState;
  readonly stats: StatsState;
  readonly s3: S3State;
  readonly uiWorkflows: WorkflowsUIState;
  readonly workflow: WorkflowState;
  readonly zenko: ZenkoState;
};
