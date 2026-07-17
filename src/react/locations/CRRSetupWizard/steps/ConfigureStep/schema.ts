import Joi from 'joi';
import type { FieldErrors, Resolver } from 'react-hook-form';
import type { VerifyRequestBody } from '../../api/types';

export type AccountNameType = 'create' | 'existing';
export type ConnectionMode = 'management-network' | 'data-network';

export type ConfigureFormValues = {
  /** Source account selection — field names match the `CreateOrSelectNameField` convention. */
  accountNameType: AccountNameType;
  accountName: string;

  connectionMode: ConnectionMode;
  url: string;
  baseDomain: string;
  s3Endpoint: string;
  username: string;
  password: string;
  certificate: string;

  destinationAccountName: string;

  createReplicationRule: boolean;
  sourceBucketName: string;
  targetBucketName: string;
  prefix: string;
};

export const defaultConfigureValues: ConfigureFormValues = {
  accountNameType: 'create',
  accountName: '',
  connectionMode: 'management-network',
  url: '',
  baseDomain: '',
  s3Endpoint: '',
  username: '',
  password: '',
  certificate: '',
  destinationAccountName: '',
  createReplicationRule: false,
  sourceBucketName: '',
  targetBucketName: '',
  prefix: '',
};

const httpsUri = Joi.string()
  .uri({ scheme: ['https'] })
  .required();

const ipv4Octet = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const managementUrlPattern = new RegExp(`^https://(?:${ipv4Octet}\\.){3}${ipv4Octet}:8443/?$`);

// biome-ignore-start lint/suspicious/noThenProperty: `then` is Joi's conditional schema branch, not a promise-like method
export const configureSchema = Joi.object<ConfigureFormValues>({
  accountNameType: Joi.string().valid('create', 'existing').required(),
  accountName: Joi.string().min(1).required(),

  connectionMode: Joi.string().valid('management-network', 'data-network').required(),
  url: Joi.when('connectionMode', {
    is: 'management-network',
    then: Joi.string()
      .pattern(managementUrlPattern)
      .required()
      .messages({ 'string.pattern.base': 'URL must match https://<IP>:8443' }),
    otherwise: Joi.string().allow(''),
  }),
  baseDomain: Joi.when('connectionMode', {
    is: 'data-network',
    then: Joi.string().hostname().required(),
    otherwise: Joi.string().allow(''),
  }),
  s3Endpoint: Joi.when('connectionMode', {
    is: 'data-network',
    then: httpsUri,
    otherwise: Joi.string().allow(''),
  }),
  username: Joi.string().required(),
  password: Joi.string().required(),
  certificate: Joi.string()
    .pattern(/-----BEGIN CERTIFICATE-----/)
    .required()
    .messages({ 'string.pattern.base': 'Paste a PEM-encoded certificate' }),

  destinationAccountName: Joi.string().min(1).required(),

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

/**
 * Extracts the destination-connection payload the configurator's /verify endpoint
 * expects from the wizard form values.
 */
export const toVerifyBody = (values: ConfigureFormValues): VerifyRequestBody => ({
  destinationConnection:
    values.connectionMode === 'management-network'
      ? {
          mode: 'management-network',
          baseUrl: values.url,
          adminUser: values.username,
          adminPassword: values.password,
        }
      : {
          mode: 'data-network',
          baseDomain: values.baseDomain,
          s3Endpoint: values.s3Endpoint,
          adminUser: values.username,
          adminPassword: values.password,
        },
  destinationCertificate: values.certificate,
});
