import { FormGroup, FormSection, spacing, Text } from '@scality/core-ui';
import React, { useEffect } from 'react';
import { Input } from '@scality/core-ui/dist/next';
import {
  FieldErrors,
  useFieldArray,
  useFormContext,
  UseFormRegister,
} from 'react-hook-form';
import { useTheme } from 'styled-components';

import { XCORE_NOT_AVAILABLE } from '../../next-architecture/ui/XCoreLibraryProvider';
import { useXCoreLibrary } from '../../next-architecture/ui/XCoreLibraryProvider';
import {
  CapacityFormWithXcore,
  CapacityFormSection,
} from './ISVCapacityFormSection';
import { unitChoices } from '../constants';

const defaultBucketNameTooltip = (
  <Text>Choose an unique name for your bucket</Text>
);

type BucketFieldProps = {
  bucketNameTooltip?: React.JSX.Element;
  platform?: string;
};

type BucketField = {
  name: string;
  tag?: string;
  capacity?: string;
  capacityUnit?: string;
};

type FormValues = {
  buckets: BucketField[];
  bucketNumber?: number;
};

const BucketNameFormGroup = ({
  index,
  errors,
  bucketNamePlaceholder,
  bucketNumber,
  bucketNameTooltip,
  register,
}: {
  index: number;
  errors: FieldErrors<FormValues>;
  bucketNamePlaceholder: string;
  bucketNumber: number;
  bucketNameTooltip: React.JSX.Element;
  register: UseFormRegister<FormValues>;
}) => (
  <FormGroup
    id={`bucketName-${index}`}
    label={bucketNumber > 1 ? `Bucket #${index + 1} name` : 'Bucket name'}
    required
    labelHelpTooltip={bucketNameTooltip}
    error={(errors?.buckets?.[index]?.name?.message as string) ?? ''}
    helpErrorPosition="bottom"
    content={
      <Input
        id={`bucketName-${index}`}
        type="text"
        autoComplete="off"
        placeholder={bucketNamePlaceholder}
        {...register(`buckets.${index}.name`)}
      />
    }
  />
);

const BucketField = (fieldOverrides: BucketFieldProps) => {
  const { bucketNameTooltip = defaultBucketNameTooltip, platform } =
    fieldOverrides;

  const theme = useTheme();

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const { fields, append, remove, replace } = useFieldArray({
    name: 'buckets',
    control,
  });

  useEffect(() => {
    if (fields.length === 0) {
      append({
        name: '',
        tag: platform,
        capacity: '0',
        capacityUnit: unitChoices.TiB.toString(),
      });
    } else {
      const updatedFields = fields.map((field) => ({
        name: field.name,
        tag: platform,
        capacity: field.capacity,
        capacityUnit: field.capacityUnit,
      }));
      replace(updatedFields);
    }
  }, [platform, fields.length]);

  const handleBucketNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.valueAsNumber;

    if (newNumber < 1 || newNumber > 20 || isNaN(newNumber)) {
      return;
    }

    if (newNumber < fields.length) {
      for (let i = fields.length - 1; i >= newNumber; i--) {
        remove(i);
      }
    } else if (newNumber > fields.length) {
      const newFields = Array(newNumber - fields.length).fill({
        name: '',
        tag: platform,
        capacity: '0',
        capacityUnit: unitChoices.TiB.toString(),
      });
      append(newFields);
    }
  };

  const bucketNamePlaceholder = `${platform}-bucket-name`;

  const xCoreLibrary = useXCoreLibrary();
  const { useClusterCapacity } =
    xCoreLibrary === XCORE_NOT_AVAILABLE
      ? { useClusterCapacity: undefined }
      : xCoreLibrary;

  const renderCapacitySection = (index: number) => {
    if (platform !== 'veeam') {
      return null;
    }

    return useClusterCapacity ? (
      <CapacityFormWithXcore
        useClusterCapacity={useClusterCapacity}
        index={index}
      />
    ) : (
      <CapacityFormSection index={index} />
    );
  };

  const renderBucketNameFormSection = () => {
    if (fields.length === 1) {
      return (
        <FormSection forceLabelWidth={280}>
          <BucketNameFormGroup
            index={0}
            errors={errors}
            bucketNamePlaceholder={bucketNamePlaceholder}
            bucketNumber={fields.length}
            bucketNameTooltip={bucketNameTooltip}
            register={register}
          />
          {renderCapacitySection(0)}
        </FormSection>
      );
    } else if (fields.length > 1) {
      return fields.map((field, index) => {
        return (
          <FormSection forceLabelWidth={272} key={field.id}>
            <div
              style={{
                backgroundColor: theme.backgroundLevel2,
                padding: spacing.f16,
                paddingLeft: spacing.f8,
                paddingBottom: spacing.f8,
                borderRadius: spacing.f4,
                marginBottom: spacing.f4,
              }}
            >
              <BucketNameFormGroup
                index={index}
                errors={errors}
                bucketNamePlaceholder={bucketNamePlaceholder}
                bucketNumber={fields.length}
                bucketNameTooltip={bucketNameTooltip}
                register={register}
              />
              {renderCapacitySection(index)}
            </div>
          </FormSection>
        );
      });
    }
  };

  return (
    <>
      <FormSection forceLabelWidth={280}>
        <FormGroup
          id="bucketNumber"
          label="Number of buckets"
          required
          labelHelpTooltip="Choose the number of buckets to create within your account"
          error={(errors.bucketNumber?.message as string) ?? ''}
          helpErrorPosition="bottom"
          content={
            <Input
              id="bucketNumber"
              type="number"
              value={fields.length}
              onChange={handleBucketNumberChange}
              size="1/3"
              min={1}
              max={20}
            />
          }
        />
      </FormSection>
      {renderBucketNameFormSection()}
    </>
  );
};

export default BucketField;
