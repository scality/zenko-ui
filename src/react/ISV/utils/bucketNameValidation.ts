import Joi from 'joi';

export const bucketErrorMessage = 'Bucket names can include only lowercase letters, numbers, dots (.), and hyphens (-)';

/**
 * Bucket name validation schema with uniqueness validation for ISV multi-bucket forms.
 * This schema validates:
 * - Required field
 * - Min 3, max 63 characters
 * - Only lowercase letters, numbers, dots, and hyphens
 * - Uniqueness within the same form array (for multi-bucket forms)
 */
export const bucketNameValidationSchema = Joi.string()
  .label('Bucket Name')
  .required()
  .min(3)
  .pattern(/^[a-z0-9.-]+$/)
  .max(63)
  .custom((value, helpers) => {
    const { state } = helpers;
    if (!state.ancestors[1]) {
      return value;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allNames = state.ancestors[1].map((item: any) => item.name);
    const occurrences = allNames.filter((n: string) => n === value).length;
    if (occurrences > 1) {
      return helpers.message({
        custom: 'Bucket name must be unique',
      });
    }
    return value;
  }, 'Unique name validation');
