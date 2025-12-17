import Joi from 'joi';
import React from 'react';

export type ISVPlatform = 'veeam-vbr' | 'commvault' | 'veeam-vbo';
export type ISVValidatedDesign =
  | 'kasten'
  | 'rubrik'
  | 'zerto'
  | 'splunk'
  | 'hycu'
  | 'cohesity'
  | 'ctera'
  | 'veritas';

export type Bucket = {
  name: string;
  tag: string;
  capacity?: string;
  capacityUnit?: string;
  capacityBytes?: number;
};

export type ISVInfo = {
  name: string;
  logo: React.JSX.Element;
  id: ISVPlatform | ISVValidatedDesign;
  getDisabledMessage?: () => React.ReactNode;
};

export type ISVCardConfig = ISVInfo & {
  application?: string;
  documentationLink: string;
  assistant?: boolean;
};

export type ISVConfig = {
  accountName: string;
  accountNameType?: 'create' | 'existing';
  IAMUserName?: string;
  IAMUserNameType?: 'create' | 'existing';
  generateKey?: boolean;
  application?: string;
  enableImmutableBackup?: boolean;
  buckets?: Bucket[];
  autoCreateRepository?: boolean;
  immutablePeriodDays?: number;
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

export type ImmutabilitySummaryOverride = (options?: {
  isImmutable?: boolean;
  application?: string;
}) => {
  label: string;
  tooltip?: React.JSX.Element;
  helpText?: string;
};

export type ISVPlatformConfig = ISVInfo & {
  description: React.ReactNode;
  bucketTag: string;
  skipModalContent?: React.JSX.Element;
  summaryBucketBanner?: React.JSX.Element;
  fieldOverrides: FieldOverride[];
  validator?: Joi.ObjectSchema<ISVConfig>;
  getPolicy: (buckets: string[], isImmutable: boolean) => string;
  immutabilitySummaryOverride?: ImmutabilitySummaryOverride;
  additionalFields?: React.ReactNode[];
  isObjectLockEnabled?: (props: ISVConfig) => boolean;
  serviceEndpointLabel?: string;
};

export type ISVSummaryData = {
  accountName: string;
  bucketName: string;
  enableImmutableBackup: boolean;
  accessKey: string;
  secretKey: string;
  application: string;
  repositoryData?: VeeamRepositoryData;
};

export type VeeamRepositoryData = {
  repositoryName: string;
  immutable?: boolean;
  immutablePeriodDays?: number;
};

export type ISVStepComponentProps = {
  config: ISVConfig;
  onConfigChange: (config: ISVConfig) => void;
  error?: string;
};
