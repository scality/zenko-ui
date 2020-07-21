// @flow
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

export interface ManagementClient {

}
