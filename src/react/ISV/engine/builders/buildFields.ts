/**
 * Field Builder
 *
 * Generates field definitions from platform configuration.
 * Handles field ordering, overrides, and insertions.
 */

import type { BaseFieldDef, BucketItemFieldDef, FieldDef, FieldOverrideConfig, PlatformConfig } from '../types';

/**
 * Apply field overrides to a base field definition
 */
function applyOverrides(baseDef: Partial<BaseFieldDef>, override?: FieldOverrideConfig): Partial<BaseFieldDef> {
  if (!override) return baseDef;

  const result = { ...baseDef };

  if (override.label !== undefined) {
    result.label = override.label;
  }
  if (override.tooltip !== undefined) {
    result.tooltip = override.tooltip;
  }
  if (override.placeholder !== undefined) {
    result.placeholder = override.placeholder;
  }
  if (override.helpText !== undefined) {
    result.helpText = override.helpText;
  }
  if (override.hideWhen !== undefined) {
    result.showWhen = (form) => !override.hideWhen!(form);
  }

  return result;
}

/**
 * Build the default bucket item fields
 */
function buildBucketItemFields(config: PlatformConfig): BucketItemFieldDef[] {
  const itemFields: BucketItemFieldDef[] = [
    {
      name: 'name',
      type: 'text',
      label: 'Bucket Name',
      placeholder: config.fieldOverrides?.bucketName?.placeholder ?? 'Enter bucket name',
    },
  ];

  // Add capacity fields if enabled
  if (config.bucketCapacity) {
    itemFields.push(
      {
        name: 'capacity',
        type: 'number',
        label: config.fieldOverrides?.capacity?.label ?? 'Capacity',
        placeholder: config.fieldOverrides?.capacity?.placeholder ?? '100',
      },
      {
        name: 'capacityUnit',
        type: 'select',
        label: 'Unit',
        defaultValue: 'GiB',
        options: [
          { label: 'GiB', value: 'GiB' },
          { label: 'TiB', value: 'TiB' },
          { label: 'PiB', value: 'PiB' },
        ],
      },
    );
  }

  return itemFields;
}

/**
 * Build all field definitions for a platform
 *
 * Field order:
 * 1. Account selector
 * 2. IAM selector (shown in Advanced Settings for existing accounts)
 * 3. [additionalFields.afterAccount]
 * 4. Buckets array
 * 5. Immutable toggle
 * 6. [additionalFields.afterImmutable]
 */
export function buildFields(config: PlatformConfig): FieldDef[] {
  const fields: FieldDef[] = [];

  // 1. Account selector
  fields.push({
    name: 'accountName',
    type: 'accountSelector',
    ...applyOverrides({ label: 'Account' }, config.fieldOverrides?.accountName),
  } as FieldDef);

  // 2. IAM User selector (shown in Advanced Settings for existing accounts)
  fields.push({
    name: 'IAMUserName',
    type: 'iamUserSelector',
    ...applyOverrides({ label: 'IAM User' }, config.fieldOverrides?.IAMUserName),
  } as FieldDef);

  // 3. Additional fields after account (and after Advanced Settings)
  if (config.additionalFields?.afterAccount) {
    fields.push(...config.additionalFields.afterAccount);
  }

  // 4. Buckets array
  fields.push({
    name: 'buckets',
    type: 'bucketArray',
    label: 'Buckets',
    itemFields: buildBucketItemFields(config),
  } as FieldDef);

  // 5. Immutable toggle
  const immutableOverride = config.fieldOverrides?.enableImmutableBackup;
  const immutableBase = applyOverrides(
    {
      label: 'Immutable Backup',
      helpText: 'It enables object-lock on the bucket which means backups will be permanent and unchangeable.',
    },
    immutableOverride,
  );

  fields.push({
    name: 'enableImmutableBackup',
    type: 'toggle',
    defaultValue: true,
    ...immutableBase,
  } as FieldDef);

  // 6. Additional fields after immutable
  if (config.additionalFields?.afterImmutable) {
    fields.push(...config.additionalFields.afterImmutable);
  }

  return fields;
}
