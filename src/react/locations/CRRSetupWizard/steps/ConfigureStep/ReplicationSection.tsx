import { Checkbox, InfoMessage, spacing } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormGroup, FormSection } from '../../../../ui-elements/CoreUIForm';
import { type AccountBuckets, BucketChoiceFields } from './BucketChoiceFields';
import { SourceBucketChoiceFields } from './SourceBucketChoiceFields';
import type { ConfigureFormValues } from './schema';

type Props = {
  destinationBuckets: AccountBuckets;
};

export const ReplicationSection = ({ destinationBuckets }: Props) => {
  const {
    register,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const enabled = watch('createReplicationRule');
  const reusesExistingAccount = watch('accountNameType') === 'existing';
  const sourceAccountName = watch('accountName');
  const requiresLock = watch('sourceObjectLockEnabled') === true;
  const targetBucketNameType = watch('targetBucketNameType');
  const errorIfTouched = (field: keyof ConfigureFormValues) =>
    touchedFields[field] ? errors[field]?.message : undefined;
  const ruleFieldsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enabled) {
      ruleFieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [enabled]);

  return (
    <FormSection forceLabelWidth="19rem" title={{ name: 'Replication' }}>
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
                title="Existing replication rules"
                content="Replication rules the source bucket already has are kept; this one is added next to them."
              />
            </div>
          )}
          <SourceBucketChoiceFields
            accountName={reusesExistingAccount && sourceAccountName ? sourceAccountName : null}
          />
          <BucketChoiceFields
            typeField="targetBucketNameType"
            nameField="targetBucketName"
            label="Target Bucket"
            buckets={destinationBuckets}
            noBucketReason="This account has no bucket on the destination"
            requireObjectLock={requiresLock}
          />
          {requiresLock && targetBucketNameType === 'create' && (
            <div style={{ marginBottom: spacing.r24 }}>
              <InfoMessage
                title="Object Lock on the destination"
                content="The destination bucket will be created with Object Lock enabled because the source bucket has Object Lock."
              />
            </div>
          )}
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
