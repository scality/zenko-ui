import {
  Control,
  FieldValues,
  Controller,
  useFormContext,
  FieldError,
  ControllerRenderProps,
} from 'react-hook-form';
import { AddButton, SubButton } from '../ui-elements/EditableKeyValue';
import type { Locations, Replication } from '../../types/config';
import {
  Banner,
  FormGroup,
  FormSection,
  Icon,
  Link,
  spacing,
  Stack,
  Text,
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
import { useQuery } from 'react-query';
import { workflowListQuery } from '../queries';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useSelector } from 'react-redux';
import { getClients } from '../utils/actions';
import { AppState } from '../../types/state';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useRolePathName } from '../utils/hooks';
import { useManagementClient } from '../ManagementProvider';
import { Account } from '../../types/iam';
import { SelectOption } from '../../types/ui';
import { useEffect } from 'react';

type Props = {
  bucketList: S3BucketList;
  locations: Locations;
  isCreateMode?: boolean;
  prefix?: string;
  isPrefixMandatory?: boolean;
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

export const replicationSchema = (
  unallowedBucketName: string[],
  sourcesPrefix: string[],
  prefixMandatory: boolean,
  isTransient: boolean,
) => {
  const disallowedPrefixes = Joi.string()
    .label('Prefix')
    .disallow(...sourcesPrefix);
  const sourcePrefix = prefixMandatory
    ? disallowedPrefixes.disallow('').required()
    : disallowedPrefixes.allow('');
  const preferredReadLocation = Joi.string().required();
  return {
    streamId: Joi.string().label('Id').allow(''),
    streamVersion: Joi.number().label('Version').optional(),
    // streamName: Joi.string().label('Name').min(4).allow('').messages({
    //     'string.min': '"Name" should have a minimum length of {#limit}',
    // }),
    enabled: Joi.boolean().label('State').required(),
    sourceBucket: Joi.string()
      .label('Bucket Name')
      .disallow(...unallowedBucketName)
      .required(),
    sourcePrefix: sourcePrefix.messages({
      'any.invalid':
        'The Prefix filter needs to be unique for any Replication from this bucket.',
    }),
    destinationLocation: Joi.array()
      .items(Joi.string().label('Destination Location Name'))
      .min(1)
      .required(),
    preferredReadLocation: isTransient
      ? preferredReadLocation
      : preferredReadLocation.allow(null),
  };
};

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
                onBlur={field.onBlur}
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

const useReplicationStreams = (account?: Account) => {
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
  const accountId = account?.id;
  const rolePathName = useRolePathName();
  const mgnt = useManagementClient();
  const replicationsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId!,
      instanceId!,
      rolePathName,
    ),
    select: (workflows) =>
      workflows.filter((w) => w.replication).map((w) => w.replication),
  });
  return replicationsQuery.data ?? [];
};

export const isTransientLocation = (
  bucketList: S3BucketList,
  locations: Locations,
  sourceBucket: string,
) => {
  const selectedBucket = bucketList.find(
    (bucket) => bucket.Name === sourceBucket,
  );
  const isTransient =
    locations[selectedBucket?.LocationConstraint ?? '']?.isTransient ?? false;
  return isTransient;
};

function ReplicationForm({
  prefix = '',
  bucketList,
  locations,
  isCreateMode,
  ...props
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
  const { account } = useCurrentAccount();
  const replicationStreams = useReplicationStreams(account);
  // TODO: make sure we do not delete bucket or location if replication created.
  if (
    !checkIfExternalLocation(locations) ||
    !checkSupportsReplicationTarget(locations)
  ) {
    return <NoLocationWarning />;
  }
  const sourceBucket: string = methods.watch(`${prefix}sourceBucket`);
  const replicationsSameBucketName = replicationStreams.filter(
    (s) => s.source.bucketName === sourceBucket,
  );
  const parentReplicationStream = replicationsSameBucketName.find((stream) => {
    const { prefix } = stream.source;
    return prefix === '' || !prefix;
  });
  const isTransient = isTransientLocation(bucketList, locations, sourceBucket);
  const existingReplicationStream = replicationsSameBucketName.find(
    (stream) => {
      const { prefix } = stream.source;
      return prefix !== '' && prefix;
    },
  );
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
        <Stack direction="vertical" gap="r24">
          <FormSection
            title={{ name: 'Source', icon: 'Simple-upload' }}
            forceLabelWidth={forceLabelWidth}
          >
            <FormGroup
              required
              id="sourceBucket"
              helpErrorPosition="bottom"
              help={
                isCreateMode
                  ? 'Source bucket has to be versioning enabled.'
                  : undefined
              }
              direction="horizontal"
              label="Bucket Name"
              content={
                <Controller
                  control={control}
                  name={`${prefix}sourceBucket`}
                  render={({
                    field: { onChange, onBlur, value: sourceBucket },
                  }) => {
                    const options = sourceBucketOptions(bucketList, locations);
                    const isEditing = !!getValues(`${prefix}streamId`);
                    const result = options.find(
                      (l) => l.value === sourceBucket,
                    );
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
          {parentReplicationStream && isCreateMode && (
            <Banner
              variant="warning"
              icon={
                <Icon
                  name="Exclamation-circle"
                  size="2x"
                  color="statusWarning"
                />
              }
            >
              <Stack direction="vertical" gap="r1">
                <Text>
                  There is already a Replication Workflow from this Bucket (with
                  no Prefix filter), you need to edit the existing Workflow, you
                  cannot create the new one.
                </Text>
                <Link
                  href={`/accounts/${account!.Name}/workflows/replication-${
                    parentReplicationStream.streamId
                  }`}
                >
                  Edit the workflow
                </Link>
              </Stack>
            </Banner>
          )}
          {((existingReplicationStream && isCreateMode) ||
            (methods.formState.isDirty && props.isPrefixMandatory)) && (
            <Banner
              variant="infoPrimary"
              icon={<Icon name="Info-circle" size="2x" color="infoPrimary" />}
            >
              <Text>
                At least one Replication Workflow already exists from this
                Bucket, with a Prefix filter.
              </Text>
            </Banner>
          )}
        </Stack>
        <FormSection
          title={{ name: 'Filter', icon: 'Filter' }}
          forceLabelWidth={forceLabelWidth}
        >
          <FormGroup
            label="Prefix"
            id="sourcePrefix"
            helpErrorPosition="bottom"
            required={!!existingReplicationStream}
            error={
              touchedFields[`${prefix}sourcePrefix`]
                ? errors[`${prefix}sourcePrefix`]?.message
                : undefined
            }
            content={
              <Input
                {...register(`${prefix}sourcePrefix`)}
                id="sourcePrefix"
                autoComplete="off"
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
          isTransient={isTransient}
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
  isTransient,
}: {
  prefix: string;
  control: Control<FieldValues, string>;
  name: string;
  isCreateMode?: boolean;
  locations: Locations;
  errors: Record<string, FieldError>;
  touchedFields: { [key: string]: boolean };
  isTransient: boolean;
}) => {
  const forceLabelWidth = convertRemToPixels(10);
  const { trigger } = useFormContext();
  const options = destinationOptions(locations);
  return (
    <FormSection
      title={{ name: 'Destination' }}
      forceLabelWidth={forceLabelWidth}
    >
      <Controller
        control={control}
        name={name}
        render={({
          field: { onChange, onBlur, value: destinationLocations },
        }) => (
          <>
            {!Array.isArray(destinationLocations)
              ? []
              : destinationLocations.map((destLoc: string, index) => {
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
                              trigger();
                            }}
                            value={destLoc}
                          >
                            {options &&
                              options.map((o, i) => {
                                const disabled =
                                  destLoc !== o.value &&
                                  destinationLocations.includes(o.value);
                                return (
                                  <Option
                                    key={i}
                                    value={o.value}
                                    disabled={disabled}
                                  >
                                    {renderDestination(locations)(o)}
                                  </Option>
                                );
                              })}
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
                              trigger();
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
                              trigger();
                            }}
                          />
                        </Box>
                      }
                    />
                  );
                })}
            <PreferredReadLocationSelector
              isTransient={isTransient}
              control={control}
              options={options}
              destinationLocations={destinationLocations}
              locations={locations}
              name={`${prefix}preferredReadLocation`}
            />
          </>
        )}
      />
    </FormSection>
  );
};

type PreferredReadLocationSelectorProps = {
  isTransient: boolean;
  control: Control<FieldValues, string>;
  options: SelectOption[];
  destinationLocations: string[];
  locations: Locations;
  name: string;
};
const PreferredReadLocationSelector = (
  props: PreferredReadLocationSelectorProps,
) => {
  if (!props.isTransient) return <></>;
  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <RenderPreferredReadLocation field={field} {...props} />
      )}
    />
  );
};

const RenderPreferredReadLocation = (
  props: PreferredReadLocationSelectorProps & {
    field: ControllerRenderProps<FieldValues, 'preferredReadLocation'>;
  },
) => {
  const { options, destinationLocations } = props;
  const { onChange, onBlur, value: preferredReadLocation } = props.field;
  const opts = options.filter((opt) =>
    destinationLocations.includes(opt.value),
  );
  useEffect(() => {
    const isIncluded = destinationLocations.includes(preferredReadLocation);
    if (preferredReadLocation && !isIncluded) {
      const nextDestination = destinationLocations[0] ?? null;
      onChange(nextDestination);
    }
  }, [preferredReadLocation, destinationLocations]);
  return (
    <FormGroup
      required
      label="Preferred Read Location"
      id={`preferredReadLocation`}
      content={
        <Select
          id="preferredReadLocationSelect"
          value={preferredReadLocation ?? ''}
          onBlur={onBlur}
          onChange={onChange}
        >
          {opts &&
            opts.map((o, i) => (
              <Option key={i} value={o.value}>
                {renderDestination(props.locations)(o)}
              </Option>
            ))}
        </Select>
      }
    />
  );
};

export default ReplicationForm;
