import AWS from 'aws-sdk';

export default class STSClient {
    constructor(conf) {
        this.client = new AWS.STS({
            endpoint: conf.stsEndpoint,
        });
    }

    assumeRoleWithWebIdentity(params) {
        const { idToken, roleArn } = params;
        const p = {
            DurationSeconds: 900, // 15 minutes
            RoleArn: roleArn,
            RoleSessionName: 'zenko-ui',
            WebIdentityToken: idToken,
        };
        return this.client.assumeRoleWithWebIdentity(p).promise();
    }

}
