import * as T from '../ui-elements/TableKeyValue2';
import Joi from '@hapi/joi';
import type { S3BucketList } from '../../types/s3';
import type { Locations } from '../../types/config';
import { Controller, useFormContext } from 'react-hook-form';
import {
  hasUniqueKeys,
  renderDestination,
  renderSource,
  sourceBucketOptions,
} from './utils';
import {
  FormGroup,
  FormSection,
  spacing,
  Stack,
  Toggle,
} from '@scality/core-ui';
import { isVersioning } from '../utils';
import { flattenFormErrors } from './utils';
import {
  Select,
  Option,
} from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import * as F from '../ui-elements/FormLayout';
import { Box, Input } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import TagsFilter from './TagsFilter';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { useTheme } from 'styled-components';

export const transitionSchema = {
  workflowId: Joi.string().optional().allow(null, ''),
  name: Joi.string().optional().allow(null, ''),
  type: Joi.string().required(),
  enabled: Joi.boolean().label('State').required(),
  bucketName: Joi.string().label('Bucket Name').required(),
  applyToVersion: Joi.string().valid('current', 'noncurrent').required(),
  locationName: Joi.string().label('Location Name').required(),
  triggerDelayDate: Joi.string().optional().allow(null, ''),
  triggerDelayDays: Joi.number().min(0).label('Trigger delay days').required(),
  filter: Joi.object({
    objectKeyPrefix: Joi.string().label('Prefix').optional().allow(null, ''),
    objectTags: Joi.array()
      .default([{ key: '', value: '' }])
      .items(
        Joi.object({
          key: Joi.string().allow(''),
          value: Joi.string().allow(''),
        }),
      )
      .custom(hasUniqueKeys, 'unique keys validation'),
  }).optional(),
};

type Props = {
  bucketList: S3BucketList;
  locations: Locations;
  prefix?: string;
};

export function GeneralTransitionGroup({
  prefix = '',
}: {
  prefix?: string;
  required?: boolean;
}) {
  const methods = useFormContext();
  return (
    <FormGroup
      required
      direction="horizontal"
      id="enabled"
      label="State"
      content={
        <Controller
          control={methods.control}
          name={`${prefix}enabled`}
          render={({ field: { onChange, value: enabled } }) => {
            return (
              <Toggle
                id="enabled"
                aria-labelledby="state"
                toggle={enabled}
                label={enabled ? 'Active' : 'Inactive'}
                onChange={() => {
                  onChange(!enabled);
                  methods.trigger(`${prefix}enabled`);
                }}
              />
            );
          }}
        />
      }
    />
  );
}

const locationsToOptions = (locations: Locations) => {
  return Object.keys(locations).map((value) => ({ value, label: value }));
};

export const TransitionForm = ({
  bucketList,
  locations,
  prefix = '',
}: Props) => {
  const forceLabelWidth = convertRemToPixels(12);
  const { register, control, watch, getValues, setValue, formState, trigger } =
    useFormContext();
  const theme = useTheme();
  const { errors: formErrors } = formState;
  const errors = flattenFormErrors(formErrors);
  const isEditing = !!getValues(`${prefix}workflowId`);
  const bucketName = watch(`${prefix}bucketName`);
  const applyToVersion = watch(`${prefix}applyToVersion`);

  const sourceBucket = bucketList.find((bucket) => bucket.Name === bucketName);
  const isSourceBucketVersionned = sourceBucket
    ? isVersioning(sourceBucket.VersionStatus)
    : false;
  // Disable the previous version if the bucket is not versionned and the default value is `Current version`
  const isPreviousVersionDisabled =
    !isSourceBucketVersionned && applyToVersion === 'current';
  useMemo(() => {
    if (!isSourceBucketVersionned && !isEditing) {
      setValue(`${prefix}applyToVersion`, 'current');
    }
  }, [isSourceBucketVersionned]);

  return (
    <>
      <input
        type="hidden"
        id="name"
        {...register(`${prefix}name`)}
        autoComplete="off"
      />
      <input
        type="hidden"
        id="workflowId"
        {...register(`${prefix}workflowId`)}
        autoComplete="off"
      />
      <input
        type="hidden"
        id="type"
        {...register(`${prefix}type`)}
        autoComplete="off"
      />
      <Stack direction="vertical" withSeparators gap="r24">
        <FormSection
          title={{ name: 'Source', icon: 'Simple-upload' }}
          forceLabelWidth={forceLabelWidth}
        >
          <FormGroup
            label="Bucket Name"
            id="bucketName"
            required
            direction="horizontal"
            error={errors[`${prefix}bucketName`]?.message}
            helpErrorPosition="right"
            content={
              <Controller
                control={control}
                name={`${prefix}bucketName`}
                render={({
                  field: { onChange, onBlur, value: sourceBucket },
                }) => {
                  const options = sourceBucketOptions(bucketList, locations);
                  const result = options.find((l) => l.value === sourceBucket);
                  if (isEditing && result) {
                    return renderSource(locations)(result);
                  }
                  return (
                    <Select
                      id="sourceBucket"
                      value={sourceBucket}
                      onBlur={onBlur}
                      onChange={(newBucket: string) => onChange(newBucket)}
                    >
                      {options &&
                        options.map((o, i) => (
                          <Option key={i} value={o.value}>
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
          title={{ name: 'Filters', icon: 'Filter' }}
          forceLabelWidth={forceLabelWidth}
        >
          <FormGroup
            label="Prefix"
            id="prefix"
            direction="horizontal"
            error={errors[`${prefix}filter.objectKeyPrefix`]?.message}
            helpErrorPosition="right"
            content={
              <Input
                id="prefix"
                {...register(`${prefix}filter.objectKeyPrefix`)}
                onChange={(evt) => {
                  register(`${prefix}filter.objectKeyPrefix`).onChange(evt);
                  trigger(`${prefix}filter.objectKeyPrefix`);
                }}
                aria-labelledby="prefix-label"
                aria-invalid={!!errors[`${prefix}filter.objectKeyPrefix`]}
                aria-describedby="error-prefix"
                autoComplete="off"
              />
            }
          />
          <FormGroup
            label="Tags"
            id="objectTags"
            direction="horizontal"
            error={errors[`${prefix}filter.objectTags`]?.message}
            helpErrorPosition="bottom"
            content={
              <Controller
                name={`${prefix}filter.objectTags`}
                control={control}
                defaultValue={[{ key: '', value: '' }]}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TagsFilter
                    onBlur={onBlur}
                    handleChange={onChange}
                    control={control}
                    fieldName={`${prefix}filter.objectTags`}
                    tags={value}
                    watch={watch}
                  />
                )}
              />
            }
          />
        </FormSection>

        <FormSection title={{ name: 'Action' }}>
          <FormGroup
            label="Transition"
            id="transition"
            required
            direction="vertical"
            help={
              isPreviousVersionDisabled
                ? 'This action is disabled when source bucket is not versionned'
                : undefined
            }
            helpErrorPosition="bottom"
            content={
              <T.Value>
                <F.Label
                  htmlFor="current"
                  style={{ alignItems: 'baseline', width: 'auto' }}
                >
                  <F.Input
                    type="radio"
                    id="current"
                    value="current"
                    {...register(`${prefix}applyToVersion`)}
                  />
                  <Box ml={1}>Current version</Box>
                </F.Label>
                <F.Label
                  htmlFor="previous"
                  style={{ alignItems: 'baseline', width: 'auto' }}
                >
                  <F.Input
                    type="radio"
                    id="previous"
                    value="noncurrent"
                    {...register(`${prefix}applyToVersion`)}
                    disabled={isPreviousVersionDisabled}
                  />
                  <Box
                    ml={1}
                    style={{ opacity: isPreviousVersionDisabled ? 0.5 : 1 }}
                  >
                    Previous version
                  </Box>
                </F.Label>
              </T.Value>
            }
          />
          <Box
            background={theme.brand.backgroundLevel3}
            padding={spacing.r16}
            display="flex"
            flexDirection="column"
            gap={spacing.r8}
            borderRadius={spacing.r4}
          >
            <FormGroup
              label="Storage Location"
              id="locationName"
              required
              direction="horizontal"
              error={errors[`${prefix}locationName`]?.message}
              helpErrorPosition="right"
              content={
                <Controller
                  control={control}
                  name={`${prefix}locationName`}
                  render={({
                    field: { onChange, onBlur, value: destinationLocation },
                  }) => {
                    const options = locationsToOptions(locations);
                    return (
                      <Select
                        id="destinationLocation"
                        onBlur={onBlur}
                        onChange={onChange}
                        value={destinationLocation}
                      >
                        {options &&
                          options.map((o, i) => (
                            <Option key={i} value={o.value}>
                              {renderDestination(locations)(o)}
                            </Option>
                          ))}
                      </Select>
                    );
                  }}
                />
              }
            />
            <FormGroup
              label="Days after object creation"
              id="triggerDelayDays"
              required
              direction="horizontal"
              error={errors[`${prefix}triggerDelayDays`]?.message}
              helpErrorPosition="bottom"
              content={
                <Input
                  id="triggerDelayDays"
                  aria-labelledby="triggerDelayDays-prefix"
                  type="number"
                  autoComplete="off"
                  {...register(`${prefix}triggerDelayDays`)}
                />
              }
            />
          </Box>
        </FormSection>
      </Stack>
    </>
  );
};
