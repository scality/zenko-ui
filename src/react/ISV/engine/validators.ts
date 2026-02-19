/**
 * Validator Helpers
 *
 * Composable Joi schema fragments for building platform validators.
 * These can be combined using object spread to create complete validators.
 */

import Joi from 'joi';
import { accountNameValidationSchema } from '../../account/AccountCreate';
import { VEEAM_OFFICE_365, VEEAM_OFFICE_365_V8 } from '../constants';
import { bucketNameValidationSchema } from '../utils/bucketNameValidation';

// ============================================================================
// Re-export base schemas for direct use
// ============================================================================

export { accountNameValidationSchema, bucketNameValidationSchema };

// ============================================================================
// Account Validation
// ============================================================================

/**
 * Account fields: accountName, accountNameType
 */
export const accountValidator = {
  accountName: accountNameValidationSchema,
  accountNameType: Joi.string().valid('create', 'existing').required(),
};

// ============================================================================
// IAM User Validation
// ============================================================================

/**
 * IAM fields: IAMUserName, IAMUserNameType, generateKey
 * These are conditional on accountNameType === 'existing'
 */
export const iamValidator = {
  IAMUserName: Joi.when('accountNameType', {
    is: 'existing',
    // biome-ignore lint/suspicious/noThenProperty: Joi.when configuration
    then: accountNameValidationSchema,
    otherwise: Joi.optional(),
  }),
  IAMUserNameType: Joi.when('accountNameType', {
    is: 'existing',
    // biome-ignore lint/suspicious/noThenProperty: Joi.when configuration
    then: Joi.string().valid('create', 'existing').required(),
    otherwise: Joi.optional(),
  }),
  generateKey: Joi.when('accountNameType', {
    is: 'existing',
    // biome-ignore lint/suspicious/noThenProperty: Joi.when configuration
    then: Joi.boolean(),
    otherwise: Joi.optional(),
  }),
};

// ============================================================================
// Bucket Validation
// ============================================================================

/**
 * Helper to validate capacity decimals (max 2 decimal places)
 */
export const checkDecimals = (value: number, helpers: Joi.CustomHelpers): number | Joi.ErrorReport => {
  const stringValue = value.toString();
  if (stringValue.includes('.')) {
    const decimals = stringValue.split('.')[1];
    if (decimals.length > 2) {
      return helpers.message({
        custom: '"capacity" must have at most 2 decimals',
      });
    }
  }
  return value;
};

/**
 * Basic bucket item schema (name only)
 * Note: .unknown(true) allows extra fields like capacity/capacityUnit to be present
 * but not validated, which is useful for shared form components
 */
export const bucketItemSchema = Joi.object({
  name: bucketNameValidationSchema,
}).unknown(true);

/**
 * Bucket item schema with capacity fields
 */
export const bucketItemWithCapacitySchema = Joi.object({
  name: bucketNameValidationSchema,
  capacity: Joi.number()
    .required()
    .min(1)
    .max(1024)
    .custom((value, helpers) => checkDecimals(value, helpers))
    .label('Capacity'),
  capacityUnit: Joi.string().valid('GiB', 'TiB', 'PiB').required(),
});

/**
 * Basic buckets array validation
 */
export const bucketsValidator = {
  buckets: Joi.array().min(1).max(20).items(bucketItemSchema),
};

/**
 * Buckets array with capacity fields
 */
export const bucketsWithCapacityValidator = {
  buckets: Joi.array().min(1).max(20).items(bucketItemWithCapacitySchema),
};

// ============================================================================
// Immutable Backup Validation
// ============================================================================

/**
 * Immutable backup toggle
 */
export const immutableValidator = {
  enableImmutableBackup: Joi.boolean().required(),
};

// ============================================================================
// Pre-composed Platform Validators
// ============================================================================

/**
 * Commvault validator (basic, no capacity)
 */
export const CommvaultValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsValidator,
  ...immutableValidator,
});

/**
 * Veeam Kasten validator (basic, no capacity)
 */
export const KastenValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsValidator,
  ...immutableValidator,
});

/**
 * Veeam VBR validator (with capacity)
 */
export const VeeamVBRValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsWithCapacityValidator,
  ...immutableValidator,
  autoCreateRepository: Joi.boolean().optional(),
  immutablePeriodDays: Joi.when('autoCreateRepository', {
    is: true,
    // biome-ignore lint/suspicious/noThenProperty: Joi.when configuration
    then: Joi.when('enableImmutableBackup', {
      is: true,
      // biome-ignore lint/suspicious/noThenProperty: Joi.when configuration
      then: Joi.number().integer().min(1).max(3650).required(),
      otherwise: Joi.optional(),
    }),
    otherwise: Joi.optional(),
  }),
});

/**
 * Veeam VBO validator (with application selection)
 */
export const VeeamVBOValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsValidator,
  application: Joi.string().valid(VEEAM_OFFICE_365, VEEAM_OFFICE_365_V8).required(),
  enableImmutableBackup: Joi.when('application', {
    is: VEEAM_OFFICE_365_V8,
    // biome-ignore lint/suspicious/noThenProperty: Joi.when configuration
    then: Joi.boolean().required(),
    otherwise: Joi.optional(),
  }),
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the appropriate bucket validator based on whether capacity is enabled
 */
export function getBucketsValidator(withCapacity: boolean): Record<string, Joi.Schema> {
  return withCapacity ? bucketsWithCapacityValidator : bucketsValidator;
}
