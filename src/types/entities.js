// @flow

export type InstanceId = string;

export type AppConfig = {
    managementEndpoint: string,
    oidcAuthority: string,
    oidcClientId: string,
    stsEndpoint: string,
    s3Endpoint: string,
};
