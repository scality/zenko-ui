import { FormGroup, FormSection, spacing, Text } from '@scality/core-ui';
import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
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
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';

const MIN_BUCKETS = 1;
const MAX_BUCKETS = 20;

const useBucketCountManager = ({
  initialValue,
  onCountChange,
}: {
  initialValue: number;
  onCountChange: (count: number) => void;
}) => {
  const [inputValue, setInputValue] = useState(initialValue.toString());

  useEffect(() => {
    setInputValue(initialValue.toString());
  }, [initialValue]);

  const handleBucketNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setInputValue(value);

      if (value === '') return;

      const newNumber = parseInt(value, 10);
      if (isNaN(newNumber)) return;

      if (newNumber > MAX_BUCKETS) {
        setInputValue(MAX_BUCKETS.toString());
        onCountChange(MAX_BUCKETS);
      } else if (newNumber >= MIN_BUCKETS) {
        onCountChange(newNumber);
      }
    },
    [onCountChange],
  );

  const handleInputBlur = useCallback(() => {
    const parsedValue = parseInt(inputValue, 10);
    const valueWithFallback = isNaN(parsedValue) ? MIN_BUCKETS : parsedValue;
    const clampedValue = Math.max(
      MIN_BUCKETS,
      Math.min(valueWithFallback, MAX_BUCKETS),
    );

    setInputValue(clampedValue.toString());
    if (clampedValue !== initialValue) {
      onCountChange(clampedValue);
    }
  }, [inputValue, onCountChange, initialValue]);

  return {
    inputValue,
    handleBucketNumberChange,
    handleInputBlur,
  };
};

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
  autoCreateRepository?: boolean;
}

const defaultBucketNameTooltip = (
  <Text>Choose an unique name for your bucket</Text>
);

const BucketContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundLevel2};
  padding: ${spacing.f16};
  padding-bottom: ${spacing.f8};
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
  platform?: string;
}> = ({
  index,
  errors,
  bucketNamePlaceholder,
  bucketNumber,
  bucketNameTooltip,
  platform,
}) => {
  const { register, watch } = useFormContext<FormValues>();
  const isVeeamVBROnly = useIsVeeamVBROnly();

  // Check if we're in Veeam context with auto-creation enabled
  const autoCreateRepository = watch('autoCreateRepository');
  const isVeeamAutoCreation =
    isVeeamVBROnly && platform === 'veeam-vbr' && autoCreateRepository;

  // Determine the appropriate label
  const getLabel = () => {
    if (isVeeamAutoCreation) {
      return bucketNumber > 1
        ? `Veeam Repository #${index + 1} Name`
        : 'Veeam Repository Name';
    }
    return bucketNumber > 1 ? `Bucket #${index + 1} name` : 'Bucket name';
  };

  return (
    <FormGroup
      id={`bucketName-${index}`}
      label={getLabel()}
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

  const { fields, append, remove } = useFieldArray({
    name: 'buckets',
    control,
  });

  const adjustBucketNumber = useCallback(
    (targetNumber: number) => {
      if (
        targetNumber < MIN_BUCKETS ||
        targetNumber > MAX_BUCKETS ||
        isNaN(targetNumber) ||
        targetNumber === fields.length
      ) {
        return;
      }

      shouldFocusRef.current = true;

      if (targetNumber < fields.length) {
        const bucketsToRemove = fields.length - targetNumber;
        const indicesToRemove = Array.from(
          { length: bucketsToRemove },
          (_, i) => fields.length - 1 - i,
        );
        remove(indicesToRemove);
      } else {
        const newFields = Array(targetNumber - fields.length).fill({
          name: '',
          tag: platform,
          capacity: '0',
          capacityUnit: unitChoices.TiB.toString(),
        });
        append(newFields);
      }
    },
    [fields.length, append, remove, platform],
  );

  const { inputValue, handleBucketNumberChange, handleInputBlur } =
    useBucketCountManager({
      initialValue: fields.length,
      onCountChange: adjustBucketNumber,
    });

  useEffect(() => {
    if (shouldFocusRef.current) {
      bucketNumberInputRef.current?.focus();
      shouldFocusRef.current = false;
    }
  }, [fields.length]);

  const bucketNamePlaceholder = useMemo(() => {
    const isVeeamVBROnly = platform === 'veeam-vbr';
    if (isVeeamVBROnly) {
      return `veeam-repository-name`;
    }
    return `${platform}-bucket-name`;
  }, [platform]);

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
        <CapacityFormSection index={index} />
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
            platform={platform}
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
              platform={platform}
            />
            <div
              style={{
                marginTop: spacing.f8,
              }}
            >
              {renderCapacitySection(index)}
            </div>
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
    platform,
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
              value={inputValue}
              onChange={handleBucketNumberChange}
              onBlur={handleInputBlur}
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
