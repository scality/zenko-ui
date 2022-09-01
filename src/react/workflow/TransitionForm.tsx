import * as T from '../ui-elements/TableKeyValue2';
import Joi from '@hapi/joi';
import type { S3BucketList } from '../../types/s3';
import type { Locations } from '../../types/config';
import { Controller, useFormContext } from 'react-hook-form';
import { WorkflowFormContainer } from '../ui-elements/WorkflowFormContainer';
import {
  hasUniqueKeys,
  renderDestination,
  renderSource,
  sourceBucketOptions,
} from './utils';
import { SecondaryText, Toggle } from '@scality/core-ui';
import { isVersioning } from '../utils';
import { flattenFormErrors } from './utils';
import {
  Select,
  Option,
} from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import { ErrorInput } from '../ui-elements/FormLayout';
import * as F from '../ui-elements/FormLayout';
import { Box } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { IconHelp } from '../ui-elements/Help';
import Input from '../ui-elements/Input';
import TagsFilter from './TagsFilter';
import TransitionTable from './TransitionTable';

export const transitionSchema = {
  workflowId: Joi.string().optional().allow(null, ''),
  name: Joi.string().optional().allow(null, ''),
  type: Joi.string().required(),
  enabled: Joi.boolean().label('State').required(),
  bucketName: Joi.string().label('Bucket Name').required(),
  applyToVersion: Joi.string().valid('current', 'previous').required(),
  locationName: Joi.string().label('Location Name').required(),
  triggerDelayDate: Joi.string().optional().allow(null, ''),
  triggerDelayDays: Joi.string().label('Trigger delay days').required(),
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

export const TransitionForm = ({
  bucketList,
  locations,
  prefix = '',
}: Props) => {
  const { register, control, watch, getValues, setValue, formState, trigger } =
    useFormContext();

  const { errors: formErrors } = formState;
  const errors = flattenFormErrors(formErrors);
  const isEditing = !!getValues(`${prefix}workflowId`);
  const locationName = watch(`${prefix}locationName`);
  const triggerDelayDays = watch(`${prefix}triggerDelayDays`);
  const bucketName = watch(`${prefix}bucketName`);
  const applyToVersion = watch(`${prefix}applyToVersion`);
  const objectKeyPrefix = watch(`${prefix}filter.objectKeyPrefix`);
  const objectTags = watch(`${prefix}filter.objectTags`);

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
    <WorkflowFormContainer>
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
      <T.ScrollArea>
        <T.Groups style={{ maxWidth: 'inherit' }}>
          <T.Group>
            <T.GroupName>General</T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key id="state"> State </T.Key>
                <T.Value>
                  <Controller
                    control={control}
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
                            trigger(`${prefix}enabled`);
                          }}
                        />
                      );
                    }}
                  />
                </T.Value>
              </T.Row>
            </T.GroupContent>
          </T.Group>

          <T.Group>
            <T.GroupName>Source</T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key required={!isEditing}> Bucket Name </T.Key>
                <T.Value>
                  <Controller
                    control={control}
                    name={`${prefix}bucketName`}
                    render={({ field: { onChange, value: sourceBucket } }) => {
                      const options = sourceBucketOptions(
                        [],
                        bucketList,
                        locations,
                      );

                      const result = options.find(
                        (l) => l.value === sourceBucket,
                      );

                      if (isEditing) {
                        return renderSource(locations)(result);
                      }

                      return (
                        <Select
                          id="sourceBucket"
                          value={sourceBucket}
                          onChange={(newBucket: string) => {
                            onChange(newBucket);
                          }}
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
                  <T.ErrorContainer>
                    <ErrorInput hasError={errors[`${prefix}bucketName`]}>
                      {' '}
                      {errors[`${prefix}bucketName`]?.message}{' '}
                    </ErrorInput>
                  </T.ErrorContainer>
                </T.Value>
              </T.Row>
            </T.GroupContent>
          </T.Group>

          <T.Group>
            <T.GroupName>
              <i className="fas fa-filter"></i> Filters (optional)
            </T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key id="prefix-label"> Prefix </T.Key>
                <T.Value>
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
                  <T.ErrorContainer>
                    <ErrorInput
                      id="error-prefix"
                      hasError={errors[`${prefix}filter.objectKeyPrefix`]}
                    >
                      {' '}
                      {errors[`${prefix}filter.objectKeyPrefix`]?.message}{' '}
                    </ErrorInput>
                  </T.ErrorContainer>
                </T.Value>
              </T.Row>
              <T.Row>
                <T.Key>Tags</T.Key>
                <T.Value>
                  <Controller
                    name={`${prefix}filter.objectTags`}
                    control={control}
                    defaultValue={[{ key: '', value: '' }]}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <TagsFilter
                          handleChange={onChange}
                          control={control}
                          fieldName={`${prefix}filter.objectTags`}
                          tags={value}
                          watch={watch}
                        />
                      );
                    }}
                  />
                </T.Value>
              </T.Row>
              <T.Row>
                <T.ErrorContainer>
                  <ErrorInput
                    id="error-objectTags"
                    hasError={errors[`${prefix}filter.objectTags`]}
                  >
                    {' '}
                    {errors[`${prefix}filter.objectTags`]?.message}{' '}
                  </ErrorInput>
                </T.ErrorContainer>
              </T.Row>
            </T.GroupContent>
          </T.Group>

          <T.Group>
            <T.GroupName>Action</T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key required={true}> Transition </T.Key>
                <T.Value>
                  <F.Label
                    htmlFor="current"
                    style={{
                      alignItems: 'baseline',
                    }}
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
                    style={{
                      alignItems: 'baseline',
                    }}
                  >
                    <F.Input
                      type="radio"
                      id="previous"
                      value="previous"
                      {...register(`${prefix}applyToVersion`)}
                      disabled={isPreviousVersionDisabled}
                    />
                    <Box
                      ml={1}
                      style={{ opacity: isPreviousVersionDisabled ? 0.5 : 1 }}
                    >
                      Previous version
                    </Box>
                    {isPreviousVersionDisabled ? (
                      <>
                        <IconHelp
                          tooltipMessage={
                            'This action is disabled when source bucket is not versionned'
                          }
                          tooltipWidth={'13rem'}
                        />
                      </>
                    ) : (
                      ''
                    )}
                  </F.Label>
                </T.Value>
              </T.Row>
              {bucketName && (
                <TransitionTable
                  bucketName={bucketName}
                  applyToVersion={applyToVersion}
                  objectKeyPrefix={objectKeyPrefix}
                  objectTags={objectTags}
                  triggerDelayDays={triggerDelayDays}
                  locationName={locationName}
                />
              )}
              <T.Row>
                <T.Key required={true}> Storage location </T.Key>
                <T.Value>
                  <Controller
                    control={control}
                    name={`${prefix}locationName`}
                    render={({
                      field: { onChange, value: destinationLocation },
                    }) => {
                      const options = Object.keys(locations).map((n) => {
                        return {
                          value: n,
                          label: n,
                        };
                      });
                      return (
                        <Select
                          id="destinationLocation"
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
                  <T.ErrorContainer>
                    <ErrorInput hasError={errors[`${prefix}locationName`]}>
                      {' '}
                      {errors[`${prefix}locationName`]?.message}{' '}
                    </ErrorInput>
                  </T.ErrorContainer>
                </T.Value>
              </T.Row>
              <T.Row>
                <T.Key required={true} id="triggerDelayDays-prefix">
                  {' '}
                  Days after object creation{' '}
                </T.Key>
                <T.Value>
                  <Controller
                    control={control}
                    name={`${prefix}triggerDelayDays`}
                    render={({
                      field: { onChange, value: triggerDelayDays },
                    }) => {
                      return (
                        <Input
                          id="triggerDelayDays"
                          aria-labelledby="triggerDelayDays-prefix"
                          onChange={onChange}
                          type="number"
                          value={triggerDelayDays}
                          autoComplete="off"
                          min={0}
                        />
                      );
                    }}
                  />
                </T.Value>
              </T.Row>
              {locationName && triggerDelayDays && triggerDelayDays > 0 && (
                <SecondaryText>
                  Objects older than {triggerDelayDays}{' '}
                  {`day${triggerDelayDays && triggerDelayDays > 1 ? 's' : ''}`}{' '}
                  will transition to{' '}
                  {renderDestination(locations)(
                    Object.keys(locations)
                      .map((n: string) => {
                        return {
                          value: n,
                          label: n,
                        };
                      })
                      .find((location) => location.value === locationName),
                  )}{' '}
                  location
                </SecondaryText>
              )}
            </T.GroupContent>
          </T.Group>
        </T.Groups>
      </T.ScrollArea>
    </WorkflowFormContainer>
  );
};
