import STS from 'aws-sdk/clients/sts';
import { genClientEndpoint } from '../react/utils';
export default class STSClient {
  client: STS;
  constructor(conf: { endpoint: string }) {
    this.client = new STS({
      endpoint: genClientEndpoint(conf.endpoint),
      region: 'us-east-1',
    });
  }

  assumeRoleWithWebIdentity(params: {
    idToken: string;
    roleArn: string;
    RoleSessionName: string;
  }) {
    const { idToken, roleArn, RoleSessionName } = params;
    const p = {
      DurationSeconds: 900, // 15 minutes
      RoleArn: roleArn,
      RoleSessionName,
      WebIdentityToken: idToken,
    };
    return this.client.assumeRoleWithWebIdentity(p).promise();
  }
}
