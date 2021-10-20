// @flow
import type { AccessKey, SecretKey } from './account';
import type { ConfigurationOverlay } from './config';

export type ApiAccountResponse = {
  body: {
    +arn: string,
    +canonicalId: string,
    +createDate: number,
    +email: string,
    +id: string,
    +quotaMax?: number,
    +userName: string,
  },
};

export type ApiConfigurationResponse = {
  body: ConfigurationOverlay,
};

export interface ManagementClient {}

export type ApiAccountKeyResponse = {
  body: {
    +accessKey: AccessKey,
    +createDate: string,
    +id: string,
    +secretKey: SecretKey,
    +userName: string,
  },
};
