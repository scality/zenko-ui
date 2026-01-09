import Joi from 'joi';
import { ReactElement, ReactNode, ComponentType } from 'react';
import { Control, FieldErrors } from 'react-hook-form';

// ============================================================================
// Platform Identity
// ============================================================================

/**
 * All valid ISV platform IDs
 *
 * - Platforms with `assistant: true` have automated configuration wizards
 * - Platforms without `assistant` only show documentation links
 */
export type ISVId =
  // Platforms with assistant (automated configuration)
  | 'veeam-vbr'
  | 'commvault'
  | 'veeam-vbo'
  // Platforms without assistant (documentation only)
  | 'kasten'
  | 'rubrik'
  | 'zerto'
  | 'splunk'
  | 'hycu'
  | 'cohesity'
  | 'ctera'
  | 'veritas';

// ============================================================================
// Form Data Types
// ============================================================================

export type BucketItem = {
  name: string;
  capacity?: number;
  capacityUnit?: 'GiB' | 'TiB' | 'PiB';
  capacityBytes?: number;
};

export type FormData = {
  accountName: string;
  accountNameType: 'create' | 'existing';
  IAMUserName?: string;
  IAMUserNameType?: 'create' | 'existing';
  generateKey?: boolean;
  application?: string;
  enableImmutableBackup: boolean;
  buckets: BucketItem[];
  autoCreateRepository?: boolean;
  immutablePeriodDays?: number;
};

// ============================================================================
// Runtime Context
// ============================================================================

export type SOSAPIStatus =
  | 'activated'
  | 'available'
  | 'wrongAccess'
  | 'unauthorized';

export type RuntimeContext = {
  _sosApiStatus: SOSAPIStatus;
  _existingAccount: {
    id: string;
    name: string;
    roleArn: string;
  } | null;
  _platformId: string;
  _bucketTag: string;
  _instanceId: string;
};

export type RuntimeHelpers = {
  isNewAccount: boolean;
  needsIAMUser: boolean;
  needsAccessKey: boolean;
};

export type FullContext = RuntimeContext & RuntimeHelpers;

// ============================================================================
// Previous Results (from useChainedMutations)
// ============================================================================

export type MutationResult<T = unknown> = {
  data?: T;
  error?: Error;
};

export type PreviousResults = Record<string, MutationResult>;

// ============================================================================
// Field Definitions
// ============================================================================

export type FieldType =
  | 'text'
  | 'number'
  | 'toggle'
  | 'select'
  | 'accountSelector'
  | 'iamUserSelector'
  | 'bucketArray'
  | 'custom';

export type SelectOption = {
  label: string;
  value: string;
};

export type FieldRenderProps = {
  name: string;
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
  formValues: FormData;
};

export type BucketItemFieldDef = {
  name: keyof BucketItem;
  type: 'text' | 'number' | 'select';
  label: string;
  placeholder?: string;
  defaultValue?: string | number;
  options?: SelectOption[];
};

export type BaseFieldDef = {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  tooltip?: ReactNode;
  helpText?: string;
  defaultValue?: unknown;
  showWhen?: (form: FormData) => boolean;
};

export type TextFieldDef = BaseFieldDef & {
  type: 'text';
  defaultValue?: string;
};

export type NumberFieldDef = BaseFieldDef & {
  type: 'number';
  defaultValue?: number;
};

export type ToggleFieldDef = BaseFieldDef & {
  type: 'toggle';
  defaultValue?: boolean;
};

export type SelectFieldDef = BaseFieldDef & {
  type: 'select';
  options: SelectOption[];
  defaultValue?: string;
};

export type AccountSelectorFieldDef = BaseFieldDef & {
  type: 'accountSelector';
};

export type IAMUserSelectorFieldDef = BaseFieldDef & {
  type: 'iamUserSelector';
};

export type BucketArrayFieldDef = BaseFieldDef & {
  type: 'bucketArray';
  itemFields: BucketItemFieldDef[];
};

export type CustomFieldDef = BaseFieldDef & {
  type: 'custom';
  render: (props: FieldRenderProps) => ReactElement;
};

export type FieldDef =
  | TextFieldDef
  | NumberFieldDef
  | ToggleFieldDef
  | SelectFieldDef
  | AccountSelectorFieldDef
  | IAMUserSelectorFieldDef
  | BucketArrayFieldDef
  | CustomFieldDef;

// ============================================================================
// Field Override
// ============================================================================

export type FieldOverrideConfig = {
  label?: string;
  tooltip?: ReactNode;
  placeholder?: string;
  helpText?: string;
  hideWhen?: (form: FormData) => boolean;
};

// ============================================================================
// Mutation Definitions
// ============================================================================

export type ActionName =
  | 'enableSOSAPI'
  | 'createAccount'
  | 'refetchConfig'
  | 'assumeRole'
  | 'createBucket'
  | 'tagBucket'
  | 'putObject'
  | 'createIAMUser'
  | 'createAccessKey'
  | 'createPolicy'
  | 'attachPolicy';

export type SingleMutationDef = {
  id: string;
  label: string;
  action: ActionName;
  when?: (form: FormData, ctx: FullContext) => boolean;
  variables: (
    form: FormData,
    prev: PreviousResults,
    ctx: FullContext
  ) => Record<string, unknown>;
};

export type PerBucketStep = {
  id: string;
  label: string;
  action: ActionName;
  when?: (form: FormData, bucket: BucketItem, ctx: FullContext) => boolean;
  variables: (
    form: FormData,
    bucket: BucketItem,
    prev: PreviousResults,
    ctx: FullContext
  ) => Record<string, unknown>;
};

export type LoopMutationDef = {
  each: 'buckets';
  steps: PerBucketStep[];
};

export type MutationDef = SingleMutationDef | LoopMutationDef;

// ============================================================================
// Summary Configuration
// ============================================================================

export type SummaryRenderProps = {
  formData: FormData;
  accessKey: string;
  secretKey: string;
  accessKeys?: string[];
  onFinish: () => void;
};

export type SummaryConfig = {
  serviceEndpointLabel?: string;
  bucketBanner?: ReactNode;
  immutability?: {
    label?: string;
    helpText?: (enabled: boolean) => string | undefined;
  };
  customRender?: ComponentType<SummaryRenderProps>;
};

// ============================================================================
// Additional Fields
// ============================================================================

export type AdditionalFieldsConfig = {
  afterAccount?: FieldDef[];
  afterImmutable?: FieldDef[];
};

// ============================================================================
// Disabled Message Component
// ============================================================================

export type DisabledMessageProps = {
  onDisabledChange?: (disabled: boolean) => void;
};

export type DisabledMessageComponent = ComponentType<DisabledMessageProps>;

// ============================================================================
// ISV Platform (Output of definePlatform)
// ============================================================================

export type ISVPlatform = {
  id: ISVId;
  name: string;
  logo: ReactElement;
  description?: ReactNode;
  skipModalContent?: ReactNode;

  bucketTag: string;

  fields: FieldDef[];
  validator: Joi.ObjectSchema;
  mutations: MutationDef[];

  summary: SummaryConfig;
  getPolicy: (buckets: string[], isImmutable: boolean) => string;

  documentationLink: string;
  assistant: boolean;
  application?: string;
  disabledMessage?: DisabledMessageComponent;
};

// ============================================================================
// Platform Config (Input to definePlatform)
// ============================================================================

export type PlatformConfig = {
  // Required
  id: ISVId;
  name: string;
  logo: ReactElement;
  policy: (buckets: string[], isImmutable: boolean) => string;
  documentationLink: string;

  // Optional card info
  assistant?: boolean;
  application?: string;
  disabledMessage?: DisabledMessageComponent;

  // Bucket tag for tagging buckets (defaults to name)
  bucketTag?: string;

  // Feature switches
  sosAPI?: boolean;
  bucketCapacity?: boolean;

  // Field overrides
  fieldOverrides?: {
    accountName?: FieldOverrideConfig;
    bucketName?: FieldOverrideConfig;
    enableImmutableBackup?: FieldOverrideConfig;
    IAMUserName?: FieldOverrideConfig;
    capacity?: FieldOverrideConfig;
  };

  // Additional fields at specific positions
  additionalFields?: AdditionalFieldsConfig;

  // Per-bucket mutation steps
  perBucketSteps?: PerBucketStep[];

  // Summary configuration
  summary?: {
    serviceEndpointLabel?: string;
    bucketBanner?: ReactNode;
    immutabilityLabel?: string;
    immutabilityHelpText?: (enabled: boolean) => string | undefined;
    customRender?: ComponentType<SummaryRenderProps>;
  };

  // Other
  description?: ReactNode;
  skipModalContent?: ReactNode;

  // Validator customization (escape hatch)
  customValidator?: Joi.ObjectSchema;

  // Override auto-generated mutations with explicit mutations
  // Use this for full control over mutation order and composition
  mutationOverrides?: MutationDef[];

  // Additional mutations to append after auto-generated mutations
  // Use this when you want the standard flow + additional steps at the end
  additionalMutations?: MutationDef[];
};

