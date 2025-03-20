import { FormGroup, FormSection, spacing, Text } from '@scality/core-ui';
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { Input } from '@scality/core-ui/dist/next';
import { FieldErrors, useFieldArray, useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import { XCORE_NOT_AVAILABLE } from '../../next-architecture/ui/XCoreLibraryProvider';
import { useXCoreLibrary } from '../../next-architecture/ui/XCoreLibraryProvider';
import {
  CapacityFormWithXcore,
  CapacityFormSection,
} from './ISVCapacityFormSection';
import { unitChoices } from '../constants';

const MIN_BUCKETS = 1;
const MAX_BUCKETS = 20;

interface BucketFieldProps {
  bucketNameTooltip?: React.ReactElement;
  platform?: string;
}

interface BucketField {
  name: string;
  tag?: string;
  capacity?: string;
  capacityUnit?: string;
}

interface FormValues {
  buckets: BucketField[];
  bucketNumber?: number;
}

const defaultBucketNameTooltip = (
  <Text>Choose an unique name for your bucket</Text>
);

const BucketContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundLevel2};
  padding: ${spacing.f16};
  padding-bottom: 0;
  border-radius: ${spacing.f4};
  margin-bottom: ${spacing.f4};
  position: relative;
  top: -${spacing.f16};
`;

const BucketNameFormGroup: React.FC<{
  index: number;
  errors: FieldErrors<FormValues>;
  bucketNamePlaceholder: string;
  bucketNumber: number;
  bucketNameTooltip: React.ReactElement;
}> = ({
  index,
  errors,
  bucketNamePlaceholder,
  bucketNumber,
  bucketNameTooltip,
}) => {
  const { register } = useFormContext<FormValues>();

  return (
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
};

const BucketField: React.FC<BucketFieldProps> = ({
  bucketNameTooltip = defaultBucketNameTooltip,
  platform,
}) => {
  const bucketNumberInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusRef = useRef(false);
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const { fields, append, replace } = useFieldArray({
    name: 'buckets',
    control,
  });

  useEffect(() => {
    if (shouldFocusRef.current) {
      bucketNumberInputRef.current?.focus();
      shouldFocusRef.current = false;
    }
  }, [fields.length]);

  const handleBucketNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.valueAsNumber;

      if (
        newNumber < MIN_BUCKETS ||
        newNumber > MAX_BUCKETS ||
        isNaN(newNumber)
      ) {
        return;
      }

      shouldFocusRef.current = true;

      if (newNumber < fields.length) {
        replace(fields.slice(0, newNumber));
      } else if (newNumber > fields.length) {
        const newFields = Array(newNumber - fields.length).fill({
          name: '',
          tag: platform,
          capacity: '0',
          capacityUnit: unitChoices.TiB.toString(),
        });
        append(newFields);
      }
    },
    [fields.length, replace, append, platform],
  );

  const bucketNamePlaceholder = useMemo(
    () => `${platform}-bucket-name`,
    [platform],
  );

  const xCoreLibrary = useXCoreLibrary();
  const { useClusterCapacity } =
    xCoreLibrary === XCORE_NOT_AVAILABLE
      ? { useClusterCapacity: undefined }
      : xCoreLibrary;

  const renderCapacitySection = useCallback(
    (index: number) => {
      if (platform !== 'veeam-vbr') {
        return null;
      }

      return useClusterCapacity ? (
        <CapacityFormWithXcore
          useClusterCapacity={useClusterCapacity}
          index={index}
          bucketNumber={fields.length}
        />
      ) : (
        <CapacityFormSection index={index} bucketNumber={fields.length} />
      );
    },
    [platform, useClusterCapacity, fields.length],
  );

  const renderBucketNameFormSection = useMemo(() => {
    if (fields.length === 1) {
      return (
        <FormSection forceLabelWidth={280}>
          <BucketNameFormGroup
            index={0}
            errors={errors}
            bucketNamePlaceholder={bucketNamePlaceholder}
            bucketNumber={fields.length}
            bucketNameTooltip={bucketNameTooltip}
          />
          {renderCapacitySection(0)}
        </FormSection>
      );
    } else if (fields.length > 1) {
      return fields.map((field, index) => (
        <FormSection forceLabelWidth={262} key={field.id}>
          <BucketContainer>
            <BucketNameFormGroup
              index={index}
              errors={errors}
              bucketNamePlaceholder={bucketNamePlaceholder}
              bucketNumber={fields.length}
              bucketNameTooltip={bucketNameTooltip}
            />
            {renderCapacitySection(index)}
          </BucketContainer>
        </FormSection>
      ));
    }
    return null;
  }, [
    fields,
    errors,
    bucketNamePlaceholder,
    bucketNameTooltip,
    renderCapacitySection,
  ]);

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
              ref={bucketNumberInputRef}
              id="bucketNumber"
              type="number"
              value={fields.length}
              onChange={handleBucketNumberChange}
              size="1/3"
              min={MIN_BUCKETS}
              max={MAX_BUCKETS}
            />
          }
        />
      </FormSection>
      {renderBucketNameFormSection}
    </>
  );
};

export default BucketField;
