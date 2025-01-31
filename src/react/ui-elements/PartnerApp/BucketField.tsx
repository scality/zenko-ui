import { FormGroup, spacing, Text } from '@scality/core-ui';
import React, { useEffect, useState } from 'react';
import { Input } from '@scality/core-ui/dist/next';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTheme } from 'styled-components';

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
};

const BucketField = (fieldOverrides: BucketFieldProps) => {
  const { bucketNameTooltip = defaultBucketNameTooltip, platform } =
    fieldOverrides;

  const theme = useTheme();
  const [bucketNumber, setBucketNumber] = useState<number>(1);

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    name: 'buckets',
    control,
  });

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
      for (let i = fields.length; i < newNumber; i++) {
        append({
          name: '',
          tag: platform,
        });
      }
    }
  };

  useEffect(() => {
    if (fields.length === 0) {
      append({
        name: '',
        tag: platform,
      });
    }
  }, []);

  const bucketNamePlaceholder = `${platform}-bucket-name`;

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
          <FormGroup
            key={field.id}
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
