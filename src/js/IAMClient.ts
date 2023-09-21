import type { AppState } from '../types/state';
import type { Credentials } from '../types/zenko';
import IAM from 'aws-sdk/clients/iam';
import type {
  IAMClient as IAMClientInterface,
  WebIdentityRoles,
} from '../types/iam';
import { getClients } from '../react/utils/actions';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { policyDocumentType } from 'aws-sdk/clients/iam';
import { genClientEndpoint } from '../react/utils';

export function getAssumeRoleWithWebIdentityIAM(
  state: AppState,
  roleArn: string,
): Promise<IAMClient> {
  const { oidc, auth } = state;
  const { stsClient } = getClients(state);

  const assumeRoleParams = {
    idToken: oidc.user.id_token,
    roleArn: roleArn,
    RoleSessionName: `ui-${oidc.user.profile.sub}`,
  };

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

export function getRolesForWebIdentity(
  endpoint: string,
  token: string,
  marker?: string,
  maxItems?: number,
): Promise<WebIdentityRoles> {
  const data = new URLSearchParams();
  data.append('Action', 'GetRolesForWebIdentity');
  data.append('WebIdentityToken', token);
  if (marker) {
    data.append('Marker', marker);
  }
  if (maxItems) {
    data.append('MaxItems', `${maxItems}`);
  }
  return fetch(endpoint, { method: 'POST', body: data.toString() }).then(
    async (r) => {
      if (r.ok) {
        return r.json();
      }
      let error;
      let textResponse;
      try {
        textResponse = await r.text();
      } catch (e) {
        throw r;
      }

      try {
        //Try to parse the json error
        error = { status: r.status, ...JSON.parse(textResponse) };
      } catch (e) {
        try {
          //Fallback to xml error parsing
          const parser = new DOMParser();
          const errorDocument = parser.parseFromString(
            textResponse,
            'text/xml',
          );
          const codeElements = errorDocument.getElementsByTagName('Code');
          const messageElements = errorDocument.getElementsByTagName('Message');

          if (codeElements.length > 0 && messageElements.length > 0) {
            error = {
              status: r.status,
              message: messageElements[0].textContent,
              code: codeElements[0].textContent,
            };
          } else {
            error = r;
          }
        } catch (e) {
          //Fallback to simple error handling based on the fetch response object
          error = r;
        }
      }

      throw error;
    },
  );
}
export default class IAMClient implements IAMClientInterface {
  client?: IAM;
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = genClientEndpoint(endpoint);
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

  deletePolicy(arn: string) {
    return notFalsyTypeGuard(this.client)
      .deletePolicy({
        PolicyArn: arn,
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
      .listAttachedUserPolicies({ UserName: userName })
      .promise();
  }

  listEntitiesForPolicy(policyArn: string, maxItems?: number, marker?: string) {
    return notFalsyTypeGuard(this.client)
      .listEntitiesForPolicy({
        MaxItems: maxItems,
        Marker: marker,
        PolicyArn: policyArn,
      })
      .promise();
  }

  listGroupsForUser(userName: string, maxItems?: number, marker?: string) {
    return notFalsyTypeGuard(this.client)
      .listGroupsForUser({
        UserName: userName,
        MaxItems: maxItems,
        Marker: marker,
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

  listPolicies(maxItems?: number, marker?: string) {
    return notFalsyTypeGuard(this.client)
      .listPolicies({
        MaxItems: maxItems,
        Marker: marker,
      })
      .promise();
  }

  getPolicyVersion(policyArn: string, defaultVersionId: string) {
    return notFalsyTypeGuard(this.client)
      .getPolicyVersion({
        PolicyArn: policyArn,
        VersionId: defaultVersionId,
      })
      .promise();
  }

  listPolicyVersions(policyArn: string) {
    return notFalsyTypeGuard(this.client)
      .listPolicyVersions({
        PolicyArn: policyArn,
      })
      .promise();
  }

  createPolicy(policyName: string, policyDocument: policyDocumentType) {
    return notFalsyTypeGuard(this.client)
      .createPolicy({
        PolicyName: policyName,
        PolicyDocument: policyDocument,
      })
      .promise();
  }

  createPolicyVersion(arn: string, document: string) {
    return notFalsyTypeGuard(this.client)
      .createPolicyVersion({
        PolicyArn: arn,
        PolicyDocument: document,
        SetAsDefault: true,
      })
      .promise();
  }

  deletePolicyVersion(arn: string, versionId: string) {
    return notFalsyTypeGuard(this.client)
      .deletePolicyVersion({ PolicyArn: arn, VersionId: versionId })
      .promise();
  }

  attachUserPolicy(userName: string, policyArn: string) {
    return notFalsyTypeGuard(this.client)
      .attachUserPolicy({
        UserName: userName,
        PolicyArn: policyArn,
      })
      .promise();
  }

  detachUserPolicy(userName: string, policyArn: string) {
    return notFalsyTypeGuard(this.client)
      .detachUserPolicy({
        UserName: userName,
        PolicyArn: policyArn,
      })
      .promise();
  }

  attachGroupPolicy(groupName: string, policyArn: string) {
    return notFalsyTypeGuard(this.client)
      .attachGroupPolicy({
        GroupName: groupName,
        PolicyArn: policyArn,
      })
      .promise();
  }

  detachGroupPolicy(groupName: string, policyArn: string) {
    return notFalsyTypeGuard(this.client)
      .detachGroupPolicy({
        GroupName: groupName,
        PolicyArn: policyArn,
      })
      .promise();
  }

  attachRolePolicy(roleName: string, policyArn: string) {
    return notFalsyTypeGuard(this.client)
      .attachRolePolicy({
        RoleName: roleName,
        PolicyArn: policyArn,
      })
      .promise();
  }

  detachRolePolicy(roleName: string, policyArn: string) {
    return notFalsyTypeGuard(this.client)
      .detachRolePolicy({
        RoleName: roleName,
        PolicyArn: policyArn,
      })
      .promise();
  }

  addUserToGroup(groupName: string, userName: string) {
    return notFalsyTypeGuard(this.client)
      .addUserToGroup({
        GroupName: groupName,
        UserName: userName,
      })
      .promise();
  }

  removeUserFromGroup(groupName: string, userName: string) {
    return notFalsyTypeGuard(this.client)
      .removeUserFromGroup({
        GroupName: groupName,
        UserName: userName,
      })
      .promise();
  }

  listGroups(maxItems?: number, marker?: string) {
    return notFalsyTypeGuard(this.client)
      .listGroups({
        MaxItems: maxItems,
        Marker: marker,
      })
      .promise();
  }

  listRoles(maxItems?: number, marker?: string) {
    return notFalsyTypeGuard(this.client)
      .listRoles({
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
