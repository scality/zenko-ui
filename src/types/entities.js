// @flow

export type ErrorMsg = {
    +message: string,
};

export type InstanceId = string;

export type AppConfig = {
    +managementEndpoint: string,
    +stsEndpoint: string,
    +s3Endpoint: string,
    +iamEndpoint: string,
    +navbarEndpoint: string,
    +navbarConfigUrl: string,
};

export type Brand = {
  statusHealthy: string,
  statusWarning: string,
  statusCritical: string,
  selectedActive: string,
  highlight: string,
  border: string,
  buttonPrimary: string,
  buttonSecondary: string,
  buttonDelete: string,
  infoPrimary: string,
  infoSecondary: string,
  backgroundLevel1: string,
  backgroundLevel2: string,
  backgroundLevel3: string,
  backgroundLevel4: string,
  textPrimary: string,
  textSecondary: string,
  textTertiary: string,
  textReverse: string,
  textLink: string,
};

export type Theme = {
  brand: Brand,
};
