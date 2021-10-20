// @flow

import type { STSClient as STSClientInterface } from '../../types/sts';

export class MockSTSClient implements STSClientInterface {
  assumeRoleWithWebIdentity() {
    return Promise.resolve({
      Credentials: {
        AccessKeyId: 'accessKey1',
        SecretAccessKey: 'verySecretKey1',
        SessionToken: 'sessionKey1',
      },
    });
  }
}
