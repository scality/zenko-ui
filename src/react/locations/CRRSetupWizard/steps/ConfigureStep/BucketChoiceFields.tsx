import { Loader, RadioGroup } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FormGroup } from '../../../../ui-elements/CoreUIForm';
import type { ConfigureFormValues } from './schema';

const BUCKET_OPTIONS = [
  { value: 'create', label: 'Create a new Bucket' },
  { value: 'existing', label: 'Use an existing Bucket' },
];

export type AccountBuckets = { names: string[]; isLoading: boolean; isError: boolean } | null;

type Props = {
  typeField: 'sourceBucketNameType' | 'targetBucketNameType';
  nameField: 'sourceBucketName' | 'targetBucketName';
  label: string;
  buckets: AccountBuckets;
  noBucketReason: string;
};

export const BucketChoiceFields = ({ typeField, nameField, label, buckets, noBucketReason }: Props) => {
  const {
    control,
    register,
    setValue,
    getValues,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const usesExistingBucket = watch(typeField) === 'existing';
  const bucketNames = buckets?.names;
  const isLoading = buckets?.isLoading ?? false;
  const isError = buckets?.isError ?? false;
  const canPickExistingBucket = isLoading || (bucketNames?.length ?? 0) > 0;

  // Otherwise a typed or stale name would be announced as a reused bucket that does not exist.
  useEffect(() => {
    if (getValues(typeField) !== 'existing' || isLoading) return;
    const name = getValues(nameField);
    if (name && !bucketNames?.includes(name)) {
      setValue(nameField, '', { shouldValidate: true });
    }
    if (!canPickExistingBucket) {
      setValue(typeField, 'create', { shouldValidate: true });
    }
  }, [bucketNames, isLoading, canPickExistingBucket, getValues, setValue, typeField, nameField]);

  const bucketOptions = useMemo(
    () =>
      BUCKET_OPTIONS.map((opt) =>
        opt.value === 'existing' && !canPickExistingBucket
          ? {
              ...opt,
              disabled: true,
              disabledReason: isError ? "Could not list the account's buckets" : noBucketReason,
            }
          : opt,
      ),
    [canPickExistingBucket, isError, noBucketReason],
  );

  return (
    <>
      {buckets && (
        <FormGroup
          id={typeField}
          direction="horizontal"
          label={label}
          required
          helpErrorPosition="bottom"
          content={
            <Controller
              name={typeField}
              control={control}
              render={({ field }) => (
                <RadioGroup
                  name={typeField}
                  aria-labelledby={`label-${typeField}`}
                  options={bucketOptions}
                  value={field.value}
                  onChange={(next) => {
                    field.onChange(next);
                    setValue(nameField, '', { shouldValidate: true, shouldDirty: false, shouldTouch: false });
                  }}
                  direction="vertical"
                />
              )}
            />
          }
        />
      )}
      <FormGroup
        id={nameField}
        direction="horizontal"
        label={`${label} name`}
        required
        helpErrorPosition="bottom"
        error={touchedFields[nameField] ? errors[nameField]?.message : undefined}
        content={
          usesExistingBucket && canPickExistingBucket ? (
            <Controller
              name={nameField}
              control={control}
              render={({ field }) => (
                <Select
                  id={nameField}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  placeholder="Select existing bucket"
                >
                  {isLoading && (
                    <Select.Option
                      disabled
                      disabledReason="Please wait until the list is loaded"
                      key="loading"
                      value="loading"
                      icon={<Loader size="small" />}
                    >
                      Loading...
                    </Select.Option>
                  )}
                  {(bucketNames ?? []).map((name) => (
                    <Select.Option key={name} value={name}>
                      {name}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          ) : (
            <Input id={nameField} autoComplete="off" {...register(nameField)} />
          )
        }
      />
    </>
  );
};
