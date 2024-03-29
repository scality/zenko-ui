import Joi from '@hapi/joi';
import {
  FormGroup,
  FormSection,
  IconHelp,
  Stack,
  Text,
  Toggle,
  spacing,
} from '@scality/core-ui';
import { Controller, useFormContext } from 'react-hook-form';
import { flattenFormErrors, hasUniqueKeys } from './utils';

import { Box, Input } from '@scality/core-ui/dist/next';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { useMemo } from 'react';
import { useBucketVersionning } from '../next-architecture/domain/business/buckets';
import { SourceBucketSelect } from './SourceBucketOption';
import TagsFilter from './TagsFilter';

type Props = {
  prefix?: string;
};

/*
currentVersionTriggerDelayDate: {message: '"expiration.currentVersionTriggerDelayDate" is not allowed to be empty', type: 'string.empty', ref: undefined}
filter: {objectKeyPrefix: {…}}
workflowId: {message: '"expiration.workflowId" is not allowed to be empty', type: 'string.empty', ref: input#workflowId}
*/

const PluralizeDays = ({ number }: { number: number | string }) => {
  return (
    <span style={{ width: '100px' }}>
      {number === 1 || number === '1' ? <>day</> : 'days'}
    </span>
  );
};

const commonSchema = {
  bucketName: Joi.string().label('Source Bucket Name').required(),
  enabled: Joi.boolean().required(),
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
  name: Joi.string().label('Workflow Description').required(),
  type: Joi.string().required(),
  workflowId: Joi.string().optional().allow(null, ''),
  currentVersionTriggerDelayDate: Joi.string().optional().allow(null, ''),
};

//At least one of currentVersion, previousVersion, expireDeleteMarkers and incompleteMutlipart are required
export const expirationSchema = Joi.object({
  ...commonSchema,
  currentVersionTriggerDelayDays: Joi.number()
    .min(1)
    .label('Expire Current version Days'),
  previousVersionTriggerDelayDays: Joi.number()
    .min(1)
    .label('Expire Previous version Days'),
  expireDeleteMarkersTrigger: Joi.boolean().invalid(false),
  incompleteMultipartUploadTriggerDelayDays: Joi.number()
    .min(1)
    .label('Expire Previous version Days'),
}).or(
  'currentVersionTriggerDelayDays',
  'previousVersionTriggerDelayDays',
  'expireDeleteMarkersTrigger',
  'incompleteMultipartUploadTriggerDelayDays',
);

export function GeneralExpirationGroup({
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
          render={({ field: { value: enabled, onChange, onBlur } }) => (
            <Toggle
              id="enabled"
              toggle={enabled}
              label={enabled ? 'Active' : 'Inactive'}
              onBlur={onBlur}
              onChange={() => {
                onChange(!enabled);
                methods.trigger(`${prefix}enabled`);
              }}
            />
          )}
        />
      }
    />
  );
}

export function ExpirationForm({ prefix = '' }: Props) {
  const forceLabelWidth = convertRemToPixels(12);
  const methods = useFormContext();
  const { register, control, watch, getValues, setValue, trigger } = methods;
  const { errors: formErrors } = methods.formState;
  const currentVersionTriggerDelayDays = watch(
    `${prefix}currentVersionTriggerDelayDays`,
  );
  const previousVersionTriggerDelayDays = watch(
    `${prefix}previousVersionTriggerDelayDays`,
  );
  const incompleteMultipartUploadTriggerDelayDays = watch(
    `${prefix}incompleteMultipartUploadTriggerDelayDays`,
  );
  const sourceBucketName = watch(`${prefix}bucketName`);
  const { versionning } = useBucketVersionning({
    bucketName: sourceBucketName,
  });

  const isSourceBucketVersionned =
    versionning.status === 'success' ? versionning.value === 'Enabled' : false;

  useMemo(() => {
    if (!isSourceBucketVersionned) {
      setValue(`${prefix}expireDeleteMarkersTrigger`, false);
      setValue(`${prefix}previousVersionTriggerDelayDays`, null);
    }
  }, [isSourceBucketVersionned]);

  const errors = flattenFormErrors(formErrors);
  const isEditing = !!getValues(`${prefix}workflowId`);

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
            required
            label="Bucket Name"
            id="bucketName"
            direction="horizontal"
            error={errors[`${prefix}bucketName`]?.message}
            helpErrorPosition="right"
            content={
              <Controller
                control={control}
                name={`${prefix}bucketName`}
                render={({
                  field: { onChange, value: sourceBucket, onBlur },
                }) => {
                  return (
                    <SourceBucketSelect
                      onBlur={onBlur}
                      id="bucketName"
                      value={sourceBucket}
                      readonly={isEditing}
                      onChange={(newBucket: string) => {
                        onChange(newBucket);
                      }}
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
                aria-invalid={!!errors[`${prefix}filter.objectKeyPrefix`]}
                aria-describedby="error-prefix"
                autoComplete="off"
              />
            }
          />
          <FormGroup
            label="Tags"
            id="filter.objectTags"
            direction="horizontal"
            error={errors[`${prefix}filter.objectTags`]?.message}
            helpErrorPosition="bottom"
            content={
              <Controller
                name={`${prefix}filter.objectTags`}
                control={control}
                defaultValue={[{ key: '', value: '' }]}
                render={({ field: { onChange, value, onBlur } }) => (
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
            required
            id="expireCurrentVersions"
            direction="horizontal"
            error={errors[`${prefix}currentVersionTriggerDelayDays`]?.message}
            helpErrorPosition="bottom"
            //@ts-expect-error fix this when you are working on it
            label={
              <>
                Expire <Text isEmphazed>Current</Text> version of objects
              </>
            }
            labelHelpTooltip={`
                    If the bucket is versioned, a delete marker will be added on objects older than ${
                      currentVersionTriggerDelayDays || 'provided'
                    } days. This does not free up storage space.
                    If the bucket is not versioned, the objects older than ${
                      currentVersionTriggerDelayDays || 'provided'
                    } days will be permanently removed.
                    `}
            content={
              <Stack>
                <Box style={{ width: convertRemToPixels(5) }}>
                  <Controller
                    control={control}
                    name={`${prefix}currentVersionTriggerDelayDays`}
                    render={({
                      field: {
                        onChange,
                        onBlur,
                        value: currentVersionTriggerDelayDays,
                      },
                    }) => (
                      <Toggle
                        id="currentVersionTriggerDelayDaysToggle"
                        placeholder="currentVersionDelayDaysToggle"
                        toggle={
                          currentVersionTriggerDelayDays !== null &&
                          currentVersionTriggerDelayDays !== undefined
                        }
                        onBlur={onBlur}
                        onChange={(e) => {
                          onChange(e.target.checked ? 7 : null);
                          if (e.target.checked) {
                            const value = `${prefix}expireDeleteMarkersTrigger`;
                            setValue(value, false);
                          }
                          methods.trigger();
                        }}
                      />
                    )}
                  />
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={spacing.r8}
                  opacity={
                    currentVersionTriggerDelayDays !== null &&
                    currentVersionTriggerDelayDays !== undefined
                      ? 1
                      : 0.5
                  }
                >
                  after
                  <Controller
                    control={control}
                    name={`${prefix}currentVersionTriggerDelayDays`}
                    render={({
                      field: {
                        onChange,
                        onBlur,
                        value: currentVersionTriggerDelayDays,
                      },
                    }) => (
                      <Input
                        size="1/3"
                        id="currentVersionTriggerDelayDays"
                        name="currentVersionTriggerDelayDays"
                        value={currentVersionTriggerDelayDays || ''}
                        onBlur={onBlur}
                        onChange={(e) => onChange(e.target.value)}
                        type="number"
                        style={{ width: '3rem', textAlign: 'right' }}
                        aria-invalid={
                          !!errors[`${prefix}currentVersionTriggerDelayDays`]
                        }
                        aria-describedby="error-currentVersionTriggerDelayDays"
                        disabled={
                          currentVersionTriggerDelayDays === null ||
                          currentVersionTriggerDelayDays === undefined
                        }
                      />
                    )}
                  />
                  <PluralizeDays number={currentVersionTriggerDelayDays} />
                </Box>
              </Stack>
            }
          />

          <FormGroup
            disabled={!isSourceBucketVersionned}
            required
            id="expirePreviousVersions"
            direction="horizontal"
            error={errors[`${prefix}previousVersionTriggerDelayDays`]?.message}
            helpErrorPosition="bottom"
            //@ts-expect-error fix this when you are working on it
            label={
              <>
                Expire <Text isEmphazed>Previous</Text> version of objects
              </>
            }
            labelHelpTooltip={`
                All the objects that become previous versions older than ${
                  previousVersionTriggerDelayDays || 'provided'
                } days will be permanently deleted.
                `}
            content={
              <Stack>
                <Box
                  display="flex"
                  style={{ width: convertRemToPixels(5) }}
                  alignItems="center"
                  gap={spacing.r4}
                >
                  <Controller
                    control={control}
                    name={`${prefix}previousVersionTriggerDelayDays`}
                    render={({
                      field: {
                        onChange,
                        onBlur,
                        value: previousVersionTriggerDelayDays,
                      },
                    }) => (
                      <Toggle
                        disabled={!isSourceBucketVersionned}
                        id="expirePreviousVersions"
                        placeholder="previousVersionDelayDaysToggle"
                        toggle={
                          previousVersionTriggerDelayDays !== null &&
                          previousVersionTriggerDelayDays !== undefined
                        }
                        onBlur={onBlur}
                        onChange={(e) => {
                          onChange(e.target.checked ? 7 : null);
                          methods.trigger();
                        }}
                      />
                    )}
                  />
                  {!isSourceBucketVersionned ? (
                    <IconHelp
                      tooltipMessage="This action is disabled when source bucket is not versioned"
                      //@ts-expect-error fix this when you are working on it
                      variant="outline"
                      overlayStyle={{ width: '13rem' }}
                    />
                  ) : (
                    ''
                  )}
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={spacing.r8}
                  opacity={
                    previousVersionTriggerDelayDays !== null &&
                    previousVersionTriggerDelayDays !== undefined
                      ? 1
                      : 0.5
                  }
                >
                  after
                  <Controller
                    control={control}
                    name={`${prefix}previousVersionTriggerDelayDays`}
                    render={({
                      field: {
                        onChange,
                        onBlur,
                        value: previousVersionTriggerDelayDays,
                      },
                    }) => (
                      <Input
                        size="1/3"
                        id="previousVersionTriggerDelayDays"
                        name={`${prefix}previousVersionTriggerDelayDays`}
                        value={previousVersionTriggerDelayDays || ''}
                        onBlur={onBlur}
                        onChange={(e) => onChange(e.target.value)}
                        type="number"
                        style={{ width: '3rem', textAlign: 'right' }}
                        aria-invalid={
                          !!errors[`${prefix}previousVersionTriggerDelayDays`]
                        }
                        aria-describedby="error-previousVersionTriggerDelayDays"
                        disabled={
                          previousVersionTriggerDelayDays === null ||
                          previousVersionTriggerDelayDays === undefined
                        }
                      />
                    )}
                  />
                  <PluralizeDays number={previousVersionTriggerDelayDays} />
                </Box>
              </Stack>
            }
          />

          <FormGroup
            data-testid="toggle-action-remove-expired-markers"
            required
            id="deleteMarkers"
            direction="horizontal"
            error={errors[`${prefix}expireDeleteMarkersTrigger`]?.message}
            helpErrorPosition="bottom"
            label="Remove expired Delete markers"
            labelHelpTooltip={`
                When you delete a versioned object, a delete marker is created.
                If all previous versions of the object subsequently expire, an expired-object Delete marker is left.
                Removing unneeded Delete markers will improve the listing of object versions.
                `}
            disabled={
              (currentVersionTriggerDelayDays !== null &&
                currentVersionTriggerDelayDays !== undefined) ||
              !isSourceBucketVersionned
            }
            content={
              //@ts-expect-error fix this when you are working on it
              <Stack>
                <Box
                  display="flex"
                  style={{ width: convertRemToPixels(5) }}
                  alignItems="center"
                  gap={spacing.r4}
                >
                  <Controller
                    control={control}
                    name={`${prefix}expireDeleteMarkersTrigger`}
                    render={({
                      field: {
                        onChange,
                        onBlur,
                        value: expireDeleteMarkersTrigger,
                      },
                    }) => (
                      <Toggle
                        disabled={
                          (currentVersionTriggerDelayDays !== null &&
                            currentVersionTriggerDelayDays !== undefined) ||
                          !isSourceBucketVersionned
                        }
                        id="expireDeleteMarkersTrigger"
                        placeholder="expireDeleteMarkersTrigger"
                        toggle={expireDeleteMarkersTrigger}
                        onBlur={onBlur}
                        onChange={(e) => {
                          onChange(e.target.checked ? true : null);
                          methods.trigger();
                        }}
                      />
                    )}
                  />
                  {(currentVersionTriggerDelayDays !== null &&
                    currentVersionTriggerDelayDays !== undefined) ||
                  !isSourceBucketVersionned ? (
                    <>
                      <IconHelp
                        tooltipMessage={`${
                          currentVersionTriggerDelayDays !== null &&
                          currentVersionTriggerDelayDays !== undefined
                            ? 'This action is disabled when "Expire Current version of objects" is active'
                            : ''
                        }${
                          !isSourceBucketVersionned
                            ? (currentVersionTriggerDelayDays !== null &&
                              currentVersionTriggerDelayDays !== undefined
                                ? '\n'
                                : '') +
                              'This action is disabled when source bucket is not versioned'
                            : ''
                        }`}
                        overlayStyle={{ width: '13rem' }}
                      />
                    </>
                  ) : (
                    ''
                  )}
                </Box>
              </Stack>
            }
          />

          <FormGroup
            data-testid="toggle-action-expire-incomplete-multipart"
            required
            id="expireIncompleteMultipart"
            direction="horizontal"
            error={
              errors[`${prefix}incompleteMultipartUploadTriggerDelayDays`]
                ?.message
            }
            helpErrorPosition="bottom"
            label="Expire incomplete Multipart uploads"
            labelHelpTooltip={`
                When you upload or copy an object, it could be done as a set of parts.
                These multiparts are not visible in the browser until the operation is complete.
                Removing these incomplete multipart uploads after a number of days after the initiating the operation prevents you from having unused S3 storage.
                    `}
            content={
              <Stack>
                <Box
                  display="flex"
                  style={{ width: convertRemToPixels(5) }}
                  alignItems="center"
                  gap={spacing.r4}
                >
                  <Controller
                    control={control}
                    name={`${prefix}incompleteMultipartUploadTriggerDelayDays`}
                    render={({
                      field: {
                        onChange,
                        onBlur,
                        value: incompleteMultipartUploadTriggerDelayDays,
                      },
                    }) => (
                      <Toggle
                        id="incompleteMultipartUploadTriggerDelayDaysToggle"
                        placeholder="incompleteMultipartUploadDelayDaysToggle"
                        toggle={
                          incompleteMultipartUploadTriggerDelayDays !== null &&
                          incompleteMultipartUploadTriggerDelayDays !==
                            undefined
                        }
                        onBlur={onBlur}
                        onChange={(e) => {
                          onChange(e.target.checked ? 7 : null);
                          methods.trigger();
                        }}
                      />
                    )}
                  />
                  {!isSourceBucketVersionned ? (
                    <IconHelp
                      tooltipMessage="This action is disabled when source bucket is not versioned"
                      //@ts-expect-error fix this when you are working on it
                      variant="outline"
                      overlayStyle={{ width: '13rem' }}
                    />
                  ) : (
                    ''
                  )}
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={spacing.r8}
                  opacity={
                    incompleteMultipartUploadTriggerDelayDays !== null &&
                    incompleteMultipartUploadTriggerDelayDays !== undefined
                      ? 1
                      : 0.5
                  }
                >
                  after
                  <Controller
                    control={control}
                    name={`${prefix}incompleteMultipartUploadTriggerDelayDays`}
                    render={({
                      field: {
                        onChange,
                        onBlur,
                        value: incompleteMultipartUploadTriggerDelayDays,
                      },
                    }) => (
                      <Input
                        size="1/3"
                        id="incompleteMultipartUploadTriggerDelayDays"
                        name={`${prefix}incompleteMultipartUploadTriggerDelayDays`}
                        value={incompleteMultipartUploadTriggerDelayDays || ''}
                        onBlur={onBlur}
                        onChange={(e) => onChange(e.target.value)}
                        type="number"
                        style={{ width: '3rem', textAlign: 'right' }}
                        aria-invalid={
                          !!errors[
                            `${prefix}incompleteMultipartUploadTriggerDelayDays`
                          ]
                        }
                        aria-describedby="error-incompleteMultipartUploadTriggerDelayDays"
                        disabled={
                          incompleteMultipartUploadTriggerDelayDays === null ||
                          incompleteMultipartUploadTriggerDelayDays ===
                            undefined
                        }
                      />
                    )}
                  />
                  <PluralizeDays
                    number={incompleteMultipartUploadTriggerDelayDays}
                  />
                </Box>
              </Stack>
            }
          />
        </FormSection>
      </Stack>
    </>
  );
}

export default ExpirationForm;
