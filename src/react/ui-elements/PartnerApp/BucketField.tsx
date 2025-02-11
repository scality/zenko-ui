import { FormGroup, spacing, Text } from '@scality/core-ui';
import React, { useEffect, useState } from 'react';
import { Input } from '@scality/core-ui/dist/next';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTheme } from 'styled-components';

import { XCORE_NOT_AVAILABLE } from '../../../react/next-architecture/ui/XCoreLibraryProvider';
import { useXCoreLibrary } from '../../../react/next-architecture/ui/XCoreLibraryProvider';
import {
  CapacityFormWithXcore,
  CapacityFormSection,
} from '../../ISV/components/ISVCapacityFormSection';
import { unitChoices } from '../../ISV/constants';

// const additionalFields = [
//   (index: number, register: any, errors: any) => (
//     <FormGroup
//       id={`bucketTest-${index}`}
//       label="Bucket test"
//       required
//       labelHelpTooltip={'TEST'}
//       error={(errors.bucketName?.message as string) ?? ''}
//       helpErrorPosition="bottom"
//       content={
//         <Input
//           id="buckettest"
//           type="text"
//           autoComplete="off"
//           placeholder="bucket-test"
//           {...register(`buckets.${index}.customField`)}
//         />
//       }
//     />
//   ),
//   (index: number, register: any, errors: any, control: any) => (
//     <FormGroup
//       id="capacity"
//       label="Max Veeam Repository Capacity"
//       error={errors.capacity?.message?.toString() ?? ''}
//       help="The recommended value is 80% of the platform's total capacity."
//       helpErrorPosition="bottom"
//       labelHelpTooltip={''}
//       content={
//         <Stack direction="horizontal">
//           <Input
//             id="capacity"
//             type="number"
//             size="1/3"
//             min={1}
//             max={1024}
//             step={0.01}
//             autoFocus={false}
//             {...register(`buckets.${index}.capacity`)}
//           />
//           <Controller
//             name={`buckets.${index}.capacityUnit`}
//             control={control}
//             render={({ field: { value, onChange } }) => {
//               return (
//                 <>
//                   <Select
//                     menuPosition="fixed"
//                     id="capacityUnit"
//                     onChange={onChange}
//                     value={value}
//                     size="1/3"
//                   >
//                     {Object.entries(unitChoices).map(([key, value]) => {
//                       return (
//                         <Select.Option key={key} value={`${value}`}>
//                           {key}
//                         </Select.Option>
//                       );
//                     })}
//                   </Select>
//                 </>
//               );
//             }}
//           ></Controller>
//         </Stack>
//       }
//     />
//   ),
// ];

const defaultBucketNameTooltip = (
  <Text>Choose an unique name for your bucket</Text>
);

type BucketFieldProps = {
  bucketNameTooltip?: React.JSX.Element;
  platform?: string;
  application?: string;
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

const BucketField = (fieldOverrides: BucketFieldProps) => {
  const {
    bucketNameTooltip = defaultBucketNameTooltip,
    platform,
    application,
  } = fieldOverrides;

  const theme = useTheme();
  const [bucketNumber, setBucketNumber] = useState<number>(1);

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
    console.log('application', application);
  }, [platform, fields.length]);

  const handleBucketNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.valueAsNumber;

    if (newNumber < 1 || newNumber > 20 || isNaN(newNumber)) {
      return;
    }

    setBucketNumber(newNumber);

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
    xCoreLibrary === XCORE_NOT_AVAILABLE ? () => ({}) : xCoreLibrary;

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

  return (
    <>
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
            value={bucketNumber}
            onChange={handleBucketNumberChange}
            size="1/3"
            min={1}
            max={20}
          />
        }
      />

      {fields.map((field, index) => {
        const BucketFormGroup = (
          <div key={field.id}>
            <FormGroup
              id={`bucketName-${index}`}
              label={
                bucketNumber > 1 ? `Bucket #${index + 1} name` : 'Bucket name'
              }
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
            {renderCapacitySection(index)}
          </div>
        );
        if (bucketNumber > 1) {
          return (
            <div
              key={field.id}
              style={{
                backgroundColor: theme.backgroundLevel2,
                padding: '1rem',
                borderRadius: spacing.f4,
                marginBottom: spacing.f4,
              }}
            >
              {BucketFormGroup}
            </div>
          );
        }

        return BucketFormGroup;
      })}
    </>
  );
};

export default BucketField;
