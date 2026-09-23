import { Checkbox, FormGroup, FormSection, InfoMessage, spacing, Text } from '@scality/core-ui';
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
  const reusesExistingAccount = watch('accountNameType') === 'existing';
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
        help="Optional — a rule can also be set up later from the bucket."
        helpErrorPosition="bottom"
        content={<Checkbox id="createReplicationRule" {...register('createReplicationRule')} />}
      />
      {enabled && (
        <div ref={ruleFieldsRef} style={{ marginTop: spacing.r24 }}>
          {reusesExistingAccount && (
            <div style={{ marginBottom: spacing.r24 }}>
              <InfoMessage
                title="Existing replication rule"
                content="If the source bucket already has a replication rule, creating one here replaces its existing replication configuration."
              />
            </div>
          )}
          <div style={{ marginBottom: spacing.r8 }}>
            <Text color="textSecondary">
              A bucket with this name will be created on the source site, unless one with the same name already exists —
              in which case it will be used.
            </Text>
          </div>
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
