// @noflow

import type { AppState, AssumeRoleParams, OIDCState } from '../types/state';
import type { Credentials } from '../types/zenko';
import IAM from 'aws-sdk/clients/iam';
import type { IAMClient as IAMClientInterface } from '../types/iam';
import { getClients } from '../react/utils/actions';

export const rolePathName = 'scality-internal/storage-manager-role';

export function getAssumeRoleWithWebIdentityParams(
  oidc: OIDCState,
  accountID: string,
): AssumeRoleParams {
  return {
    idToken: oidc.user.id_token,
    roleArn: `arn:aws:iam::${accountID}:role/${rolePathName}`,
    RoleSessionName: oidc.user.profile.sub,
  };
}

export function getAssumeRoleWithWebIdentityIAM(
  state: AppState,
  accountName: string,
): Promise<IAMClient> {
  const { oidc, auth, configuration } = state;
  const { stsClient } = getClients(state);
  const accounts = configuration.latest.users;
  const account = accounts.find(a => a.userName === accountName);

  if (!account || !oidc || !oidc.user) return Promise.reject();
  const assumeRoleParams = getAssumeRoleWithWebIdentityParams(oidc, account.id);
  return stsClient.assumeRoleWithWebIdentity(assumeRoleParams).then(creds => {
    const params = {
      accessKey: creds.Credentials.AccessKeyId,
      secretKey: creds.Credentials.SecretAccessKey,
      sessionToken: creds.Credentials.SessionToken,
    };
    const iamClient = new IAMClient(auth.config.iamEndpoint);
    iamClient.login(params);
    return iamClient;
  });
}

export default class IAMClient implements IAMClientInterface {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  login(creds: Credentials) {
    this.client = new IAM({
      // endpoint: 'https://iam.amazonaws.com',
      endpoint: this.endpoint,
      accessKeyId: creds.accessKey,
      secretAccessKey: creds.secretKey,
      sessionToken: creds.sessionToken,
      region: 'us-east-1',
    });
  }

  logout() {
    if (this.client)
      this.client.config.update({
        accessKeyId: '',
        secretAccessKey: '',
        sessionToken: '',
      });
  }

  createAccessKey(userName) {
    return this.client
      .createAccessKey({
        UserName: userName,
      })
      .promise();
  }

  createUser(userName) {
    return this.client
      .createUser({
        UserName: userName,
      })
      .promise();
  }

  deleteAccessKey(accessKey, userName) {
    const params = {
      AccessKeyId: accessKey,
      UserName: userName,
    };
    return this.client.deleteAccessKey(params).promise();
  }

  updateAccessKey(accessKey, status, userName) {
    const params = {
      AccessKeyId: accessKey,
      Status: status,
      UserName: userName,
    };
    return this.client.updateAccessKey(params).promise();
  }

  deleteUser(userName) {
    return this.client
      .deleteUser({
        UserName: userName,
      })
      .promise();
  }

  getUser(userName) {
    return this.client
      .getUser({
        UserName: userName,
      })
      .promise();
  }

  listOwnAccessKeys() {
    return this.client.listAccessKeys().promise();
  }

  listAccessKeys(userName, marker) {
    const req = this.client.listAccessKeys({
      UserName: userName,
      Marker: marker,
    });

    return req.promise();
  }

  listAttachedUserPolicies(userName) {
    return this.client
      .listAttachedUserPolicies({
        UserName: userName,
      })
      .promise();
  }

  listGroupsForUser(userName) {
    return this.client
      .listGroupsForUser({
        UserName: userName,
      })
      .promise();
  }

  listUsers(maxItems, marker) {
    return this.client
      .listUsers({
        MaxItems: maxItems,
        Marker: marker,
      })
      .promise();
  }
}

// OFFLILE
// export default class IAMClient {
//     constructor() {
//         this.users = [{
//             UserName: 'Alice',
//             Arn: 'arn:alice:bucket1:write:read:exec',
//             CreateDate: '2020-02-02',
//             UserId: '12331-13434-3413-4134-1434-134',
//         },{
//             UserName: 'Bob',
//             Arn: 'arn:bob:bucket2:write:read:exec',
//             CreateDate: '2019-02-03',
//             UserId: '22331-13434-3413-4134-1434-134',
//         }];
//     }
//
//     createUser(userName) {
//         this.users.push({
//             UserName: userName,
//             Arn: 'arn:'+ userName +':bucket1:write:read:exec',
//             CreateDate: '2020-02-18',
//             UserId: '111111-111111-1111-1111-1111-111',
//         });
//         this.users = [...this.users];
//         return new Promise(resolve => {
//             return resolve();
//         });
//     }
//
//     listUsers() {
//         return new Promise(resolve => {
//             return resolve({Users: this.users});
//         });
//     }
//
// }
