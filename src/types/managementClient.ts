import { UiFacingApi } from '../js/managementClient/api';
import type { AccessKey, SecretKey } from './account';
import type { ConfigurationOverlay } from './config';
export type ApiAccountResponse = {
  body: {
    readonly arn: string;
    readonly canonicalId: string;
    readonly createDate: number;
    readonly email: string;
    readonly id: string;
    readonly quotaMax?: number;
    readonly userName: string;
  };
};
export type ApiConfigurationResponse = {
  body: ConfigurationOverlay;
};
export type ManagementClient = UiFacingApi;
export type ApiAccountKeyResponse = {
  body: {
    readonly accessKey: AccessKey;
    readonly createDate: string;
    readonly id: string;
    readonly secretKey: SecretKey;
    readonly userName: string;
  };
};
