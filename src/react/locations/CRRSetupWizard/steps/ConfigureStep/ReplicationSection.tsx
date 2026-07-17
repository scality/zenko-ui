import { Checkbox, FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { useFormContext } from 'react-hook-form';
import type { ConfigureFormValues } from './schema';

export const ReplicationSection = () => {
  const {
    register,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const enabled = watch('createReplicationRule');
  const errorIfTouched = (field: keyof ConfigureFormValues) =>
    touchedFields[field] ? errors[field]?.message : undefined;

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Replication' }}>
      <FormGroup
        id="createReplicationRule"
        direction="horizontal"
        label="Create Replication Rule"
        helpErrorPosition="bottom"
        content={<Checkbox id="createReplicationRule" {...register('createReplicationRule')} />}
      />
      {enabled && (
        <FormGroup
          id="sourceBucketName"
          direction="horizontal"
          label="Source Bucket Name"
          required
          helpErrorPosition="bottom"
          error={errorIfTouched('sourceBucketName')}
          content={<Input id="sourceBucketName" autoComplete="off" {...register('sourceBucketName')} />}
        />
      )}
      {enabled && (
        <FormGroup
          id="targetBucketName"
          direction="horizontal"
          label="Target Bucket Name"
          required
          helpErrorPosition="bottom"
          error={errorIfTouched('targetBucketName')}
          content={<Input id="targetBucketName" autoComplete="off" {...register('targetBucketName')} />}
        />
      )}
      {enabled && (
        <FormGroup
          id="prefix"
          direction="horizontal"
          label="Prefix (optional)"
          helpErrorPosition="bottom"
          error={errorIfTouched('prefix')}
          content={<Input id="prefix" autoComplete="off" {...register('prefix')} />}
        />
      )}
    </FormSection>
  );
};
