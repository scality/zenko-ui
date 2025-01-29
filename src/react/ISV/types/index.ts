import Joi from '@hapi/joi';

export type ISVPlatform = 'veeam' | 'commvault';

export type ISVConfig = {
  accountName: string;
  accountNameType?: 'create' | 'existing';
  IAMUserName?: string;
  IAMUserNameType?: 'create' | 'existing';
  application?: string;
  enableImmutableBackup?: boolean;
  buckets?: {
    name: string;
    tag: string;
    capacity?: string;
    capacityUnit?: string;
    capacityBytes?: number;
  }[];
};

export type ISVFieldOverride = {
  name: keyof ISVConfig;
  label?: string;
  tooltip?: React.JSX.Element;
  helpText?: string;
  placeholder?: string;
  additional?: React.JSX.Element[];
};

export type FieldOverride = {
  name: string;
  label: string;
  placeholder?: string;
  tooltip?: React.JSX.Element;
  helpText?: string;
  additional?: React.JSX.Element[];
};

export type ISVPlatformConfig = {
  id: ISVPlatform;
  name: string;
  logo: React.JSX.Element;
  description: string;
  bucketTag: string;
  skipModalContent?: React.JSX.Element;
  fieldOverrides: FieldOverride[];
  validator?: Joi.ObjectSchema<ISVConfig>;
};

export type ISVSummaryData = {
  accountName: string;
  bucketName: string;
  enableImmutableBackup: boolean;
  accessKey: string;
  secretKey: string;
  application: string;
};

export type ISVStepComponentProps = {
  config: ISVConfig;
  onConfigChange: (config: ISVConfig) => void;
  error?: string;
};
