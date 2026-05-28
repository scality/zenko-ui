import type { UseFormReturn } from 'react-hook-form';
import type { BucketArrayFieldDef, FormData } from '../../engine/types';
import BucketField from '../BucketField';

type BucketArrayFieldProps = {
  field: BucketArrayFieldDef;
  formMethods: UseFormReturn<FormData>;
  platform: string;
};

/**
 * Wrapper component for BucketField that integrates with the platform system.
 * Determines whether to show capacity fields based on itemFields configuration.
 */
export const BucketArrayField: React.FC<BucketArrayFieldProps> = ({ field, platform }) => {
  const hasCapacityField = field.itemFields?.some((f) => f.name === 'capacity');

  return (
    <BucketField
      platform={platform}
      bucketNameTooltip={field.tooltip as React.ReactElement}
      bucketNameHelpText={field.helpText}
      showCapacity={hasCapacityField}
    />
  );
};
