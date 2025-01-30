import { FormGroup, spacing, Text, Toggle } from '@scality/core-ui';
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
  const {
    bucketNameTooltip = defaultBucketNameTooltip,

    platform,
  } = fieldOverrides;
  const theme = useTheme();
  const [bucketNumber, setBucketNumber] = useState<number>(1);
  // const [bucketPrefix, setBucketPrefix] = useState<string>('');
  const [isGlobal, setIsGlobal] = useState<boolean>(true);

  const {
    register,
    control,
    setValue,
    unregister,
    watch,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    name: 'buckets',
    control,
  });
  const bucketPrefix = watch('bucketPrefix');

  useEffect(() => {
    if (isGlobal && bucketNumber > 1 && bucketPrefix) {
      fields.forEach((field, index) => {
        setValue(
          `buckets.${index}.name`,
          bucketPrefix + '-' + (index + 1).toFixed(0).padStart(2, '0'),
        );
      });
    }
  }, [bucketPrefix, isGlobal, bucketNumber]);

  const handleBucketNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.valueAsNumber < 1 || e.target.valueAsNumber > 20) {
      return;
    } else if (e.target.valueAsNumber < fields.length) {
      remove(fields.length - 1);
    } else if (e.target.valueAsNumber > fields.length) {
      append({
        name: bucketPrefix
          ? bucketPrefix + '-' + (fields.length + 1).toFixed(0).padStart(2, '0')
          : '',
        tag: platform,
      });
    }

    setBucketNumber(e.target.valueAsNumber);
  };

  const handleGlobalValueChange = () => {
    unregister('bucketPrefix', { keepValue: true });
    setIsGlobal(!isGlobal);
  };

  const bucketNamePlaceholder = `${platform}-bucket-name`;
  const bucketPrefixPlaceholder = `${platform}-bucket-prefix`;

  return (
    <>
      <FormGroup
        id="bucketNumber"
        label="Number of buckets"
        required
        labelHelpTooltip={
          'Choose the number of buckets to create within your account'
        }
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
            max={10}
          />
        }
      ></FormGroup>
      {bucketNumber > 1 && (
        <FormGroup
          id="globalValue"
          label="Set up values on the level"
          help={
            isGlobal
              ? 'The values will be applied to all the buckets'
              : 'Fill the details for each bucket'
          }
          content={
            <Toggle
              label={isGlobal ? 'Global' : 'Details'}
              toggle={isGlobal}
              onChange={handleGlobalValueChange}
            ></Toggle>
          }
          helpErrorPosition="bottom"
        />
      )}

      {bucketNumber > 1 && isGlobal && (
        <FormGroup
          id="bucketPrefix"
          label="Bucket Prefix"
          required
          labelHelpTooltip={
            <>
              Choose a prefix for your buckets, the buckets will be
              automatically named using the prefix and a number.
            </>
          }
          error={(errors.bucketPrefix?.message as string) ?? ''}
          helpErrorPosition="bottom"
          help='The buckets will be named "prefix-01", "prefix-02", etc.'
          content={
            <Input
              id="bucketPrefix"
              type="text"
              autoComplete="off"
              placeholder={bucketPrefixPlaceholder}
              {...register('bucketPrefix')}
            />
          }
        />
      )}

      {(bucketNumber > 1 && !isGlobal) || bucketNumber === 1
        ? fields.map((field, index) => {
            if (bucketNumber > 1) {
              return (
                <div
                  key={field.id}
                  style={{
                    backgroundColor: theme.backgroundLevel2,
                    padding: '1rem',
                    borderRadius: spacing.f4,
                  }}
                >
                  <Text isEmphazed>Bucket # {index + 1} </Text>
                  <FormGroup
                    id={`bucketName-${index}`}
                    label="Bucket name"
                    required
                    labelHelpTooltip={bucketNameTooltip}
                    error={
                      (errors?.buckets?.[index]?.name?.message as string) ?? ''
                    }
                    helpErrorPosition="bottom"
                    content={
                      <Input
                        id="bucketName"
                        type="text"
                        autoComplete="off"
                        placeholder={bucketNamePlaceholder}
                        {...register(`buckets.${index}.name`)}
                      />
                    }
                  />
                  {/* {additionalFields.map((field) => {
                    return field(index, register, errors, control);
                  })} */}
                </div>
              );
            }

            return (
              <FormGroup
                key={field.id}
                id={`bucketName-${index}`}
                label="Bucket name"
                required
                labelHelpTooltip={bucketNameTooltip}
                error={
                  (errors?.buckets?.[index]?.name?.message as string) ?? ''
                }
                helpErrorPosition="bottom"
                content={
                  <Input
                    id="bucketName"
                    type="text"
                    autoComplete="off"
                    placeholder={bucketNamePlaceholder}
                    {...register(`buckets.${index}.name`)}
                  />
                }
              />
            );
          })
        : null}
    </>
  );
};

export default BucketField;
