import Joi from '@hapi/joi';
import {
  FormGroup,
  FormSection,
  Stack,
  Toggle,
  spacing,
} from '@scality/core-ui';
import {
  Option,
  Select,
} from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import { Box, Input } from '@scality/core-ui/dist/next';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTheme } from 'styled-components';
import { LocationV1 } from '../../js/managementClient/api';
import { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useBucketVersionning } from '../next-architecture/domain/business/buckets';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import * as F from '../ui-elements/FormLayout';
import * as T from '../ui-elements/TableKeyValue2';
import { SourceBucketSelect } from './SourceBucketOption';
import TagsFilter from './TagsFilter';
import { flattenFormErrors, hasUniqueKeys, renderDestination } from './utils';

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

const locationsToOptions = (locations: LocationInfo[]) => {
  return locations
    .filter(
      (location) =>
        location.type !== LocationV1.LocationTypeEnum.ScalityHdclientV2,
    )
    .map(({ name }) => ({ value: name, label: name }));
};

export const TransitionForm = ({ prefix = '' }: Props) => {
  const forceLabelWidth = convertRemToPixels(12);
  const { register, control, watch, getValues, setValue, formState, trigger } =
    useFormContext();
  const theme = useTheme();
  const { errors: formErrors } = formState;
  const errors = flattenFormErrors(formErrors);
  const isEditing = !!getValues(`${prefix}workflowId`);
  const bucketName = watch(`${prefix}bucketName`);
  const applyToVersion = watch(`${prefix}applyToVersion`);

  const { versionning } = useBucketVersionning({ bucketName });
  const isSourceBucketVersionned =
    versionning.status === 'success' && versionning.value === 'Enabled';
  // Disable the previous version if the bucket is not versioned and the default value is `Current version`
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
                  return (
                    <SourceBucketSelect
                      id="sourceBucket"
                      value={sourceBucket}
                      onBlur={onBlur}
                      readonly={isEditing}
                      onChange={(newBucket: string) => onChange(newBucket)}
                    />
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
                ? 'This action is disabled when source bucket is not versioned'
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
            background={theme.backgroundLevel3}
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
                    const accountsLocationsEndpointsAdapter =
                      useAccountsLocationsEndpointsAdapter();
                    const { accountsLocationsAndEndpoints, status } =
                      useAccountsLocationsAndEndpoints({
                        accountsLocationsEndpointsAdapter,
                      });
                    if (status === 'loading' || status === 'idle')
                      return <>Loading locations...</>;
                    if (status === 'error') {
                      return <>Error loading locations</>;
                    }
                    const options = locationsToOptions(
                      accountsLocationsAndEndpoints?.locations ?? [],
                    );
                    return (
                      <Select
                        id="locationName"
                        onBlur={onBlur}
                        onChange={onChange}
                        value={destinationLocation}
                      >
                        {options &&
                          options.map((o, i) => (
                            <Option key={i} value={o.value}>
                              {renderDestination(
                                accountsLocationsAndEndpoints?.locations ?? [],
                              )(o)}
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
