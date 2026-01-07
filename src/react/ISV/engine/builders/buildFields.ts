/**
 * Field Builder
 *
 * Generates field definitions from platform configuration.
 * Handles field ordering, overrides, and insertions.
 */

import type {
  PlatformConfig,
  FieldDef,
  BucketItemFieldDef,
  FieldOverrideConfig,
  BaseFieldDef,
} from '../types';

/**
 * Apply field overrides to a base field definition
 */
function applyOverrides(
  baseDef: Partial<BaseFieldDef>,
  override?: FieldOverrideConfig
): Partial<BaseFieldDef> {
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
      placeholder:
        config.fieldOverrides?.bucketName?.placeholder ?? 'Enter bucket name',
    },
  ];

  // Add capacity fields if enabled
  if (config.bucketCapacity) {
    itemFields.push(
      {
        name: 'capacity',
        type: 'number',
        label: config.fieldOverrides?.capacity?.label ?? 'Capacity',
        placeholder:
          config.fieldOverrides?.capacity?.placeholder ?? '100',
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
      }
    );
  }

  return itemFields;
}

/**
 * Build all field definitions for a platform
 *
 * Field order:
 * 1. Account selector
 * 2. [insertFields.afterAccount]
 * 3. IAM selector (shown in Advanced Settings for existing accounts)
 * 4. Buckets array
 * 5. Immutable toggle
 * 6. [insertFields.afterImmutable]
 */
export function buildFields(config: PlatformConfig): FieldDef[] {
  const fields: FieldDef[] = [];

  // 1. Account selector
  fields.push({
    name: 'accountName',
    type: 'accountSelector',
    ...applyOverrides(
      { label: 'Account' },
      config.fieldOverrides?.accountName
    ),
  } as FieldDef);

  // 2. Insert after account
  if (config.insertFields?.afterAccount) {
    fields.push(...config.insertFields.afterAccount);
  }

  // 3. IAM User selector (shown in Advanced Settings for existing accounts)
  fields.push({
    name: 'IAMUserName',
    type: 'iamUserSelector',
    ...applyOverrides(
      { label: 'IAM User' },
      config.fieldOverrides?.IAMUserName
    ),
  } as FieldDef);

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
      helpText:
        'It enables object-lock on the bucket which means backups will be permanent and unchangeable.',
    },
    immutableOverride
  );

  fields.push({
    name: 'enableImmutableBackup',
    type: 'toggle',
    defaultValue: true,
    ...immutableBase,
  } as FieldDef);

  // 6. Insert after immutable
  if (config.insertFields?.afterImmutable) {
    fields.push(...config.insertFields.afterImmutable);
  }

  return fields;
}
