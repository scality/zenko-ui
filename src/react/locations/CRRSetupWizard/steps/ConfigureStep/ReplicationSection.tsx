import { Checkbox, FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { useEffect, useRef } from 'react';
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
  const ruleFieldsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enabled) {
      ruleFieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [enabled]);

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Replication' }}>
      <FormGroup
        id="createReplicationRule"
        direction="horizontal"
        label="Create Replication Rule"
        help="Optional — creating a rule now is not required, it can also be set up later from the bucket."
        helpErrorPosition="bottom"
        content={<Checkbox id="createReplicationRule" {...register('createReplicationRule')} />}
      />
      {enabled && (
        <div ref={ruleFieldsRef}>
          <FormGroup
            id="sourceBucketName"
            direction="horizontal"
            label="Source Bucket name"
            required
            helpErrorPosition="bottom"
            error={errorIfTouched('sourceBucketName')}
            content={<Input id="sourceBucketName" autoComplete="off" {...register('sourceBucketName')} />}
          />
          <FormGroup
            id="targetBucketName"
            direction="horizontal"
            label="Target Bucket name"
            required
            helpErrorPosition="bottom"
            error={errorIfTouched('targetBucketName')}
            content={<Input id="targetBucketName" autoComplete="off" {...register('targetBucketName')} />}
          />
          <FormGroup
            id="prefix"
            direction="horizontal"
            label="Prefix (optional)"
            helpErrorPosition="bottom"
            error={errorIfTouched('prefix')}
            content={<Input id="prefix" autoComplete="off" {...register('prefix')} />}
          />
        </div>
      )}
    </FormSection>
  );
};
