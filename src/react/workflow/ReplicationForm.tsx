import {
  Control,
  FieldValues,
  Controller,
  useFormContext,
  FieldError,
} from 'react-hook-form';
import { AddButton, SubButton } from '../ui-elements/EditableKeyValue';
import type { Locations, Replication } from '../../types/config';
import {
  FormGroup,
  FormSection,
  spacing,
  Stack,
  Toggle,
} from '@scality/core-ui';
import {
  Select,
  Option,
} from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import {
  checkIfExternalLocation,
  checkSupportsReplicationTarget,
} from '../utils/storageOptions';
import {
  destinationOptions,
  flattenFormErrors,
  flattenFormTouchedFields,
  renderDestination,
  renderSource,
  sourceBucketOptions,
} from './utils';
import Joi from '@hapi/joi';

import { NoLocationWarning } from '../ui-elements/Warning';
import type { S3BucketList } from '../../types/s3';

import { Box, Input } from '@scality/core-ui/dist/next';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';

type Props = {
  bucketList: S3BucketList;
  locations: Locations;
  isCreateMode?: boolean;
  prefix?: string;
};

export const disallowedPrefixes = (
  bucketName: string,
  streams: Replication[],
) => {
  return streams
    .filter((s) => {
      const src = s.source.bucketName;
      return !!src && src === bucketName;
    })
    .flatMap((s) => {
      const { prefix } = s.source;
      return prefix ? [prefix] : [];
    });
};

export const replicationSchema = (sourcesPrefix: string[]) => ({
  streamId: Joi.string().label('Id').allow(''),
  streamVersion: Joi.number().label('Version').optional(),
  // streamName: Joi.string().label('Name').min(4).allow('').messages({
  //     'string.min': '"Name" should have a minimum length of {#limit}',
  // }),
  enabled: Joi.boolean().label('State').required(),
  sourceBucket: Joi.string().label('Bucket Name').required(),
  sourcePrefix: Joi.string()
    .label('Prefix')
    .disallow(...sourcesPrefix)
    .allow(''),
  destinationLocation: Joi.array()
    .items(Joi.string().label('Destination Location Name'))
    .min(1)
    .required(),
});

export function GeneralReplicationGroup({
  prefix = '',
}: {
  prefix?: string;
  required?: boolean;
}) {
  const methods = useFormContext();
  return (
    <FormGroup
      direction="horizontal"
      id="enabled"
      label="State"
      required
      content={
        <Controller
          control={methods.control}
          name={`${prefix}enabled`}
          render={({ field }) => {
            const enabled = field.value;
            const onChange = () => {
              field.onChange(!enabled);
              methods.trigger(`${prefix}enabled`);
            };
            return (
              <Toggle
                toggle={enabled}
                id="enabled"
                label={enabled ? 'Active' : 'Inactive'}
                onChange={onChange}
                placeholder="isReplicationToggle"
              />
            );
          }}
        />
      }
    />
  );
}

function ReplicationForm({
  prefix = '',
  bucketList,
  locations,
  isCreateMode,
}: Props) {
  const forceLabelWidth = convertRemToPixels(10);
  const methods = useFormContext();
  const {
    register,
    control,
    trigger,
    getValues,
    formState: { errors: formErrors, touchedFields: formTouched },
  } = methods;
  const errors = flattenFormErrors(formErrors);
  const touchedFields = flattenFormTouchedFields(formTouched);
  // TODO: make sure we do not delete bucket or location if replication created.
  if (
    !checkIfExternalLocation(locations) ||
    !checkSupportsReplicationTarget(locations)
  ) {
    return <NoLocationWarning />;
  }

  return (
    <>
      <input
        type="hidden"
        id="streamId"
        {...register(`${prefix}streamId`)}
        autoComplete="off"
      />
      <input
        type="hidden"
        id="streamVersion"
        {...register(`${prefix}streamVersion`)}
        autoComplete="off"
      />

      <Stack direction="vertical" withSeparators gap="r24">
        <FormSection
          title={{ name: 'Source', icon: 'Simple-upload' }}
          forceLabelWidth={forceLabelWidth}
        >
          <FormGroup
            required
            id="sourceBucket"
            labelHelpTooltip={
              isCreateMode
                ? 'Source bucket has to be versioning enabled'
                : undefined
            }
            direction="horizontal"
            label="Bucket Name"
            error={
              touchedFields[`${prefix}sourceBucket`]
                ? errors[`${prefix}sourceBucket`]?.message
                : undefined
            }
            content={
              <Controller
                control={control}
                name={`${prefix}sourceBucket`}
                render={({
                  field: { onChange, onBlur, value: sourceBucket },
                }) => {
                  const options = sourceBucketOptions(bucketList, locations);
                  const isEditing = !!getValues(`${prefix}streamId`);
                  const result = options.find((l) => l.value === sourceBucket);
                  if (isEditing) {
                    // TODO: To be removed once retrieving workflows per account:
                    if (!result) {
                      return (
                        <span>
                          {' '}
                          {sourceBucket}{' '}
                          <small>
                            (depreciated because entity does not exist){' '}
                          </small>{' '}
                        </span>
                      );
                    }
                    return renderSource(locations)(result);
                  }
                  return (
                    <Select
                      data-testid="select-bucket-name-replication"
                      onBlur={onBlur}
                      id="sourceBucket"
                      value={sourceBucket}
                      onChange={(...values) => {
                        onChange(...values);
                        trigger();
                      }}
                      disabled={isEditing}
                    >
                      {options &&
                        options.map((o, i) => (
                          <Option
                            title={o.disabled ? 'Versioning is disabled' : ''}
                            key={i}
                            value={o.value}
                            disabled={o.disabled}
                          >
                            {renderSource(locations)(o)}
                          </Option>
                        ))}
                    </Select>
                  );
                }}
              />
            }
          />
        </FormSection>
        <FormSection
          title={{ name: 'Filter', icon: 'Filter' }}
          forceLabelWidth={forceLabelWidth}
        >
          <FormGroup
            label="Prefix"
            id="sourcePrefix"
            error={
              touchedFields[`${prefix}sourcePrefix`]
                ? errors[`${prefix}sourcePrefix`]?.message
                : undefined
            }
            content={
              <Controller
                control={control}
                name={`${prefix}sourcePrefix`}
                render={({
                  field: { onChange, onBlur, value: sourcePrefix },
                }) => {
                  return (
                    <Input
                      onBlur={onBlur}
                      id="sourcePrefix"
                      onChange={onChange}
                      value={sourcePrefix}
                      autoComplete="off"
                    />
                  );
                }}
              />
            }
          />
        </FormSection>
        <RenderDestination
          touchedFields={touchedFields}
          prefix={prefix}
          control={control}
          name={`${prefix}destinationLocation`}
          isCreateMode={isCreateMode}
          locations={locations}
          errors={errors}
        />
      </Stack>
    </>
  );
}

const RenderDestination = ({
  prefix,
  control,
  name,
  locations,
  errors,
  touchedFields,
}: {
  prefix: string;
  control: Control<FieldValues, string>;
  name: string;
  isCreateMode?: boolean;
  locations: Locations;
  errors: Record<string, FieldError>;
  touchedFields: { [key: string]: boolean };
}) => {
  const forceLabelWidth = convertRemToPixels(10);
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value: destinationLocations },
      }) => (
        <FormSection
          title={{ name: 'Destination' }}
          forceLabelWidth={forceLabelWidth}
        >
          {!Array.isArray(destinationLocations)
            ? []
            : destinationLocations.map((destLoc: string, index) => {
                const options = destinationOptions(locations);
                const fieldName = `${prefix}destinationLocation.${index}`;
                const err = errors[fieldName];
                const touched = touchedFields[fieldName];
                return (
                  <FormGroup
                    required={index === 0}
                    label={index === 0 ? 'Location Name' : ''}
                    id={`select-location-${index}`}
                    error={touched ? err?.message : undefined}
                    helpErrorPosition="right"
                    content={
                      <Box
                        gap={spacing.r8}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        data-testid={`select-location-name-replication-${index}`}
                      >
                        <Select
                          onBlur={onBlur}
                          id="destinationLocation"
                          onChange={(value) => {
                            const newValues = [...destinationLocations];
                            newValues[index] = value;
                            onChange(newValues);
                          }}
                          value={destLoc}
                        >
                          {options &&
                            options.map((o, i) => (
                              <Option
                                key={i}
                                value={o.value}
                                disabled={
                                  destLoc !== o.value &&
                                  destinationLocations.includes(o.value)
                                }
                              >
                                {renderDestination(locations)(o)}
                              </Option>
                            ))}
                        </Select>
                        <SubButton
                          disabled={destinationLocations[0] === ''}
                          index={index}
                          items={destinationLocations}
                          deleteEntry={() => {
                            if (destinationLocations.length === 1) {
                              onChange(['']);
                            } else {
                              const newValues = [...destinationLocations];
                              newValues.splice(index, 1);
                              onChange(newValues);
                            }
                          }}
                        />
                        <AddButton
                          disabled={
                            destinationLocations.length === options.length ||
                            destinationLocations.includes('')
                          }
                          index={index}
                          items={destinationLocations}
                          insertEntry={() => {
                            if (destinationLocations.includes('')) return;
                            onChange([...destinationLocations, '']);
                          }}
                        />
                      </Box>
                    }
                  />
                );
              })}
        </FormSection>
      )}
    />
  );
};

export default ReplicationForm;
