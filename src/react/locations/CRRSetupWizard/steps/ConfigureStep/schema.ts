import Joi from 'joi';
import type { FieldErrors, Resolver } from 'react-hook-form';
import { accountNameValidationSchema } from '../../../../account/AccountCreate';
import type { ResolveRequestBody, StartSetupBody, VerifyRequestBody } from '../../api/types';

export type AccountNameType = 'create' | 'existing';

export type ConfigureFormValues = {
  /** Source account selection — field names match the `CreateOrSelectNameField` convention. */
  accountNameType: AccountNameType;
  accountName: string;

  baseDomain: string;
  username: string;
  password: string;
  certificate: string;

  /** Hostname of the destination S3 endpoint the user picked from discovery. */
  selectedEndpoint: string;

  destinationAccountName: string;

  createReplicationRule: boolean;
  sourceBucketName: string;
  targetBucketName: string;
  prefix: string;
};

export const defaultConfigureValues: ConfigureFormValues = {
  accountNameType: 'create',
  accountName: '',
  baseDomain: '',
  username: '',
  password: '',
  certificate: '',
  selectedEndpoint: '',
  destinationAccountName: '',
  createReplicationRule: false,
  sourceBucketName: '',
  targetBucketName: '',
  prefix: '',
};

// biome-ignore-start lint/suspicious/noThenProperty: `then` is Joi's conditional schema branch, not a promise-like method
export const configureSchema = Joi.object<ConfigureFormValues>({
  accountNameType: Joi.string().valid('create', 'existing').required(),
  accountName: Joi.when('accountNameType', {
    is: 'create',
    then: accountNameValidationSchema,
    otherwise: Joi.string().min(1).required(),
  }),

  baseDomain: Joi.string().hostname().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  certificate: Joi.string()
    .pattern(/-----BEGIN CERTIFICATE-----/)
    .required()
    .messages({ 'string.pattern.base': 'Paste a PEM-encoded certificate' }),

  selectedEndpoint: Joi.string().min(1).required(),

  destinationAccountName: accountNameValidationSchema,

  createReplicationRule: Joi.boolean().required(),
  sourceBucketName: Joi.when('createReplicationRule', {
    is: true,
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().allow(''),
  }),
  targetBucketName: Joi.when('createReplicationRule', {
    is: true,
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().allow(''),
  }),
  prefix: Joi.string().allow(''),
});
// biome-ignore-end lint/suspicious/noThenProperty: `then` is Joi's conditional schema branch, not a promise-like method

/**
 * Inline Joi resolver — avoids sharing `@hookform/resolvers/joi` across the
 * Federation container, which has caused runtime `toNestErrors is not a
 * function` on legacy shells that hold an older shared singleton. The form is
 * flat, so we assign each field's error at its top-level path.
 */
export const configureResolver: Resolver<ConfigureFormValues> = (values) => {
  const { error } = configureSchema.validate(values, { abortEarly: false });
  if (!error) {
    return { values, errors: {} as Record<string, never> };
  }
  const errors: FieldErrors<ConfigureFormValues> = {};
  for (const detail of error.details) {
    const path = detail.path.join('.') as keyof ConfigureFormValues;
    if (!errors[path]) {
      errors[path] = { type: detail.type, message: detail.message };
    }
  }
  return { values: {} as Record<string, never>, errors };
};

export const endpointUrl = (hostname: string): string => `https://${hostname}`;

// Verify only authenticates and lists endpoints, so it carries no S3 endpoint.
export const toVerifyBody = (values: ConfigureFormValues): VerifyRequestBody => ({
  destinationConnection: {
    baseDomain: values.baseDomain,
    adminUser: values.username,
    adminPassword: values.password,
  },
  destinationCertificate: values.certificate,
});

export const toResolveBody = (values: ConfigureFormValues): ResolveRequestBody => ({
  s3Endpoint: endpointUrl(values.selectedEndpoint),
  destinationCertificate: values.certificate,
});

export const toStartSetupBody = (values: ConfigureFormValues): StartSetupBody => {
  const body: StartSetupBody = {
    destinationConnection: {
      baseDomain: values.baseDomain,
      adminUser: values.username,
      adminPassword: values.password,
      s3Endpoint: endpointUrl(values.selectedEndpoint),
    },
    destinationCertificate: values.certificate,
    destinationAccount: { mode: 'create', name: values.destinationAccountName },
  };
  if (values.createReplicationRule && values.targetBucketName) {
    body.targetBucket = values.targetBucketName;
  }
  return body;
};
