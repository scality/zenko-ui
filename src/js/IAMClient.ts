import type { AppState, AssumeRoleParams, OIDCState } from '../types/state';
import type { Credentials } from '../types/zenko';
import IAM from 'aws-sdk/clients/iam';
import type { IAMClient as IAMClientInterface } from '../types/iam';
import { getClients } from '../react/utils/actions';
import { notFalsyTypeGuard } from '../types/typeGuards';
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
  const account = accounts.find((a) => a.userName === accountName);
  if (!account || !oidc || !oidc.user) return Promise.reject();
  const assumeRoleParams = getAssumeRoleWithWebIdentityParams(oidc, account.id);
  return stsClient.assumeRoleWithWebIdentity(assumeRoleParams).then((creds) => {
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
  client?: IAM;
  endpoint: string;

  constructor(endpoint: string) {
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

  createAccessKey(userName: string) {
    return notFalsyTypeGuard(this.client)
      .createAccessKey({
        UserName: userName,
      })
      .promise();
  }

  createUser(userName: string) {
    return notFalsyTypeGuard(this.client)
      .createUser({
        UserName: userName,
      })
      .promise();
  }

  deleteAccessKey(accessKey: string, userName: string) {
    const params = {
      AccessKeyId: accessKey,
      UserName: userName,
    };
    return notFalsyTypeGuard(this.client).deleteAccessKey(params).promise();
  }

  updateAccessKey(accessKey: string, status: string, userName: string) {
    const params = {
      AccessKeyId: accessKey,
      Status: status,
      UserName: userName,
    };
    return notFalsyTypeGuard(this.client).updateAccessKey(params).promise();
  }

  updateUser(newUserName: string, userName: string) {
    const params = {
      NewUserName: newUserName,
      UserName: userName,
    };
    return notFalsyTypeGuard(this.client).updateUser(params).promise();
  }

  deleteUser(userName: string) {
    return notFalsyTypeGuard(this.client)
      .deleteUser({
        UserName: userName,
      })
      .promise();
  }

  getUser(userName: string) {
    return notFalsyTypeGuard(this.client)
      .getUser({
        UserName: userName,
      })
      .promise();
  }

  listOwnAccessKeys() {
    return notFalsyTypeGuard(this.client).listAccessKeys().promise();
  }

  listAccessKeys(userName: string, marker?: string) {
    const req = notFalsyTypeGuard(this.client).listAccessKeys({
      UserName: userName,
      Marker: marker,
    });
    return req.promise();
  }

  listAttachedUserPolicies(userName: string) {
    return notFalsyTypeGuard(this.client)
      .listAttachedUserPolicies({
        UserName: userName,
      })
      .promise();
  }

  listGroupsForUser(userName: string) {
    return notFalsyTypeGuard(this.client)
      .listGroupsForUser({
        UserName: userName,
      })
      .promise();
  }

  listUsers(maxItems?: number, marker?: string) {
    return notFalsyTypeGuard(this.client)
      .listUsers({
        MaxItems: maxItems,
        Marker: marker,
      })
      .promise();
  }
} // OFFLINE
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
