import AWS from 'aws-sdk';

export default class STSClient {
    constructor(conf, token) {
        this.client = new AWS.STS({
            endpoint: conf.stsEndpoint,
        });
        this.token = token;
    }

    assumeRoleWithWebIdentity() {
        const params = {
            DurationSeconds: 900,
            // ProviderId: 'accounts.google.com',
            RoleArn: 'arn:aws:iam::236423648091:role/zenko-ui-role',
            RoleSessionName: 'app1',
            WebIdentityToken: this.token,
        };
        return this.client.assumeRoleWithWebIdentity(params).promise();
    }

}
