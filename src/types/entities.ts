export type ErrorMsg = {
  readonly message: string;
};
export type InstanceId = string;
export type AppConfig = {
  readonly managementEndpoint: string;
  readonly stsEndpoint: string;
  readonly zenkoEndpoint: string;
  readonly iamEndpoint: string;
  readonly iamInternalFQDN: string;
  readonly s3InternalFQDN: string;
  readonly basePath: string;
  readonly features: string[];
};
