// @flow

export type InstanceId = string;

export type AppConfig = {
    +managementEndpoint: string,
    +stsEndpoint: string,
    +s3Endpoint: string,
    +navbarEndpoint: string,
    +navbarConfigUrl: string,
};
