import Joi from '@hapi/joi';
import {
  Banner,
  FormGroup,
  FormSection,
  Icon,
  Link as LinkStyle,
  Stack,
  Text,
  Toggle,
  spacing,
} from '@scality/core-ui';
import {
  Option,
  Select,
} from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import { Box, Input } from '@scality/core-ui/dist/next';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { useEffect } from 'react';
import {
  Control,
  Controller,
  ControllerRenderProps,
  FieldError,
  FieldValues,
  useFormContext,
} from 'react-hook-form';
import { useQuery } from 'react-query';
import { Link } from 'react-router';
import { Account } from '../../types/iam';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { SelectOption } from '../../types/ui';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useManagementClient } from '../ManagementProvider';
import { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useBucketLocationConstraint } from '../next-architecture/domain/business/buckets';
import { useLocationAndStorageInfos } from '../next-architecture/domain/business/locations';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { workflowListQuery } from '../queries';
import { AddButton, SubButton } from '../ui-elements/EditableKeyValue';
import { NoLocationWarning } from '../ui-elements/Warning';
import { useRolePathName } from '../utils/hooks';
import {
  checkIfExternalLocation,
  checkSupportsReplicationTarget,
  getLocationTypeKey,
} from '../utils/storageOptions';
import { SourceBucketSelect } from './SourceBucketOption';
import { WorkflowState } from './WorkflowState';
import {
  destinationOptions,
  flattenFormErrors,
  flattenFormTouchedFields,
  renderDestination,
} from './utils';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import { ReplicationStreamInternalV1 } from '../../js/managementClient/api';
import { useShellHooks } from '@scality/module-federation';

type Props = {
  isCreateMode?: boolean;
  prefix?: string;
  isPrefixMandatory?: boolean;
};

export const disallowedPrefixes = (
  bucketName: string,
  streams: ReplicationStreamInternalV1[],
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

// Shared validation function for CRR fields that can be used in both validate functions and resolver
export const validateCRRFields = (
  destinationLocations: string[] | undefined,
  crrLocationNames: string[],
  bucketNameValue: string | undefined,
  roleValue: string | undefined,
): {
  bucketNameError?: string;
  roleError?: string;
} => {
  const errors: { bucketNameError?: string; roleError?: string } = {};
  
  if (!Array.isArray(destinationLocations) || destinationLocations.length === 0) {
    return errors;
  }
  
  // Check if there's exactly one CRR location and no non-CRR locations
  const crrLocations = destinationLocations.filter((loc: string) => 
    loc && crrLocationNames.includes(loc)
  );

  if (crrLocations.length > 0) {
    if (!bucketNameValue || bucketNameValue === '') {
      errors.bucketNameError = 'Target bucket name is required for CRR locations';
    }
    if (!roleValue || roleValue === '') {
      errors.roleError = 'Role is required for CRR locations';
    }
  }
  
  return errors;
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
    destinationBucketName: Joi.string()
      .label('Target Bucket Name')
      .allow('', null)
      .optional(),
    destinationRole: Joi.string()
      .label('Role')
      .allow('', null)
      .optional(),
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
  const instanceId = useInstanceId();
  const accountId = account?.id;
  const rolePathName = useRolePathName();
  const mgnt = useManagementClient();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const replicationsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId,
      instanceId,
      rolePathName,
      getToken,
    ),
    select: (workflows) =>
      workflows.filter((w) => w.replication).map((w) => w.replication),
  });
  return replicationsQuery.data ?? [];
};

function ReplicationForm({ prefix = '', isCreateMode, ...props }: Props) {
  const forceLabelWidth = convertRemToPixels(12);
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
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints, status: locationStatus } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter,
    });

  const sourceBucket: string = methods.watch(`${prefix}sourceBucket`);
  const replicationsSameBucketName = replicationStreams.filter(
    (s) => s.source.bucketName === sourceBucket,
  );
  const parentReplicationStream = replicationsSameBucketName.find((stream) => {
    const { prefix } = stream.source;
    return prefix === '' || !prefix;
  });

  const { locationConstraint } = useBucketLocationConstraint({
    bucketName: sourceBucket,
  });
  const locationInfos = useLocationAndStorageInfos({
    locationName:
      locationConstraint.status === 'success' ? locationConstraint.value : '',
    accountsLocationsEndpointsAdapter,
  });
  const isTransient =
    locationInfos.status === 'success' &&
    locationInfos.value.location?.isTransient;
  const existingReplicationStream = replicationsSameBucketName.find(
    (stream) => {
      const { prefix } = stream.source;
      return prefix !== '' && prefix;
    },
  );

  if (locationStatus === 'loading' || locationStatus === 'idle') {
    return <>Loading locations...</>;
  }
  if (
    !checkIfExternalLocation(accountsLocationsAndEndpoints?.locations || []) ||
    !checkSupportsReplicationTarget(
      accountsLocationsAndEndpoints?.locations || [],
    )
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
                    const isEditing = !!getValues(`${prefix}streamId`);

                    return (
                      <SourceBucketSelect
                        onBlur={onBlur}
                        id="sourceBucket"
                        value={sourceBucket}
                        onChange={(...values) => {
                          onChange(...values);
                          trigger();
                        }}
                        readonly={isEditing}
                        disableOption={({
                          isBucketVersionned,
                          isReplicationSourceSupported,
                          isVeeamBucket,
                        }) => ({
                          disabled:
                            isReplicationSourceSupported ||
                            !isBucketVersionned ||
                            isVeeamBucket,
                          disabledMessage: isReplicationSourceSupported ? (
                            <>This location does not support replication</>
                          ) : !isBucketVersionned && isVeeamBucket ? (
                            <ul>
                              <li>
                                The source bucket has to be versioning enabled.
                              </li>
                              <li>
                                Replication is not available for a Bucket that
                                was created especially for Veeam.
                              </li>
                            </ul>
                          ) : !isBucketVersionned ? (
                            <>The source bucket has to be versioning enabled.</>
                          ) : isVeeamBucket ? (
                            <>
                              Replication is not available for a Bucket that was
                              created especially for Veeam.
                            </>
                          ) : undefined,
                        })}
                      />
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
                {account && (
                  <LinkStyle
                    as={Link}
                    to={`/accounts/${account.Name}/workflows/replication-${
                      parentReplicationStream.streamId
                    }`}
                  >
                    Edit the workflow
                  </LinkStyle>
                )}
              </Stack>
            </Banner>
          )}
          {((existingReplicationStream && isCreateMode) ||
            (methods.formState.isDirty && props.isPrefixMandatory)) && (
            <Banner
              //@ts-expect-error fix this when you are working on it
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
          locations={accountsLocationsAndEndpoints?.locations || []}
          errors={errors}
          isTransient={!!isTransient}
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
  locations: LocationInfo[];
  errors: Record<string, FieldError>;
  touchedFields: { [key: string]: boolean };
  isTransient: boolean;
}) => {
  const forceLabelWidth = convertRemToPixels(12);
  const methods = useFormContext();
  const { trigger, register, watch, setValue } = methods;
  const options = destinationOptions(locations);
  const destinationLocations = watch(name) || [];
  
  // Check if any destination location is CRR
  const hasCRRLocation = Array.isArray(destinationLocations)
    ? destinationLocations.some((destLoc: string) => {
        if (!destLoc) return false;
        const location = locations.find((l) => l.name === destLoc);
        return (
          location &&
          getLocationTypeKey(location) === 'location-scality-crr-v1'
        );
      })
    : false;

  // Check if there are non-CRR locations when CRR is present
  const hasNonCRRLocations = Array.isArray(destinationLocations)
    ? destinationLocations.some((destLoc: string) => {
        if (!destLoc) return false;
        const location = locations.find((l) => l.name === destLoc);
        return (
          location &&
          getLocationTypeKey(location) !== 'location-scality-crr-v1'
        );
      })
    : false;

  // Check if there's exactly one CRR location
  const crrLocations = Array.isArray(destinationLocations)
    ? destinationLocations.filter((destLoc: string) => {
        if (!destLoc) return false;
        const location = locations.find((l) => l.name === destLoc);
        return (
          location &&
          getLocationTypeKey(location) === 'location-scality-crr-v1'
        );
      })
    : [];
  const hasSingleCRRLocation = crrLocations.length === 1;

  const bucketNameFieldName = `${prefix}destinationBucketName`;
  const roleFieldName = `${prefix}destinationRole`;

  const bucketNameError = errors[bucketNameFieldName];
  const roleError = errors[roleFieldName];
  const bucketNameTouched = touchedFields[bucketNameFieldName];
  const roleTouched = touchedFields[roleFieldName];


  return (
    <FormSection
      title={{ name: 'Destination' }}
      forceLabelWidth={forceLabelWidth}
    >
      <Controller
        // This required hack is there to indicates to FormSection to remove the
        // (optional) text.
        // eslint-disable-next-line
        // @ts-ignore
        required
        control={control}
        name={name}
        render={({
          field: { onChange, onBlur, value: destinationLocations },
        }) => {
          return (
          <>
            {hasCRRLocation && hasNonCRRLocations && (
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
                <Text>
                  Replication rules to a CRR location can only mention a single CRR
                  location as destination. Please remove other locations or remove the
                  CRR location.
                </Text>
              </Banner>
            )}
            {!Array.isArray(destinationLocations)
              ? []
              : destinationLocations.map((destLoc: string, index) => {
                  const fieldName = `${prefix}destinationLocation.${index}`;
                  const err = errors[fieldName];
                  const touched = touchedFields[fieldName];

                  return (
                    <FormGroup
                      key={index}
                      required={index === 0}
                      label={index === 0 ? 'Location Name' : ''}
                      id={`select-location-${destinationLocations.length - 1}`}
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
                            id={`select-location-${index}`}
                            onChange={(value) => {
                              const newValues = [...destinationLocations];
                              newValues[index] = value;
                              
                              // Check if CRR status changed
                              const oldLocation = locations.find((l) => l.name === destLoc);
                              const newLocation = locations.find((l) => l.name === value);
                              const wasCRR = oldLocation && getLocationTypeKey(oldLocation) === 'location-scality-crr-v1';
                              const isCRR = newLocation && getLocationTypeKey(newLocation) === 'location-scality-crr-v1';
                              
                              // Check if any location in new values is CRR
                              const willHaveCRR = newValues.some((loc: string) => {
                                if (!loc) return false;
                                const locInfo = locations.find((l) => l.name === loc);
                                return locInfo && getLocationTypeKey(locInfo) === 'location-scality-crr-v1';
                              });
                              
                              // Reset bucketName and role if CRR status changed
                              if (wasCRR !== isCRR || (wasCRR && !willHaveCRR)) {
                                setValue(bucketNameFieldName, '');
                                setValue(roleFieldName, '');
                              }
                              
                              // Trigger validation for bucketName and role to re-validate with new CRR status
                              trigger(bucketNameFieldName);
                              trigger(roleFieldName);
                              
                              onChange(newValues);
                              trigger(name);
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
                              // Check if the location being deleted is CRR
                              const deletedLocation = locations.find((l) => l.name === destLoc);
                              const wasCRR = deletedLocation && getLocationTypeKey(deletedLocation) === 'location-scality-crr-v1';
                              
                              let newValues: string[];
                              if (destinationLocations.length === 1) {
                                newValues = [''];
                              } else {
                                newValues = [...destinationLocations];
                                newValues.splice(index, 1);
                              }
                              
                              // Check if new values will have any CRR location
                              const willHaveCRR = newValues.some((loc: string) => {
                                if (!loc) return false;
                                const locInfo = locations.find((l) => l.name === loc);
                                return locInfo && getLocationTypeKey(locInfo) === 'location-scality-crr-v1';
                              });
                              
                              // Reset bucketName and role if CRR location was removed or no CRR locations remain
                              if (wasCRR || (!willHaveCRR && hasCRRLocation)) {
                                setValue(bucketNameFieldName, '');
                                setValue(roleFieldName, '');
                              }
                              
                              // Trigger validation for bucketName and role to re-validate with new CRR status
                              trigger(bucketNameFieldName);
                              trigger(roleFieldName);
                              
                              onChange(newValues);
                              trigger(name);
                            }}
                          />
                          <AddButton
                            disabled={
                              destinationLocations.length === options.length ||
                              destinationLocations.includes('') ||
                              hasCRRLocation
                            }
                            index={index}
                            items={destinationLocations}
                            insertEntry={() => {
                              if (destinationLocations.includes('')) return;
                              if (hasCRRLocation) return;
                              onChange([...destinationLocations, '']);
                              trigger();
                            }}
                          />
                          <WorkflowState locationName={destLoc} />
                        </Box>
                      }
                    />
                  );
                })}
            {hasSingleCRRLocation && !hasNonCRRLocations && (
              <>
                <FormGroup
                  required
                  label="Target Bucket Name"
                  id="target-bucket-name"
                  error={
                    bucketNameTouched
                      ? bucketNameError?.message
                      : undefined
                  }
                  helpErrorPosition="bottom"
                  content={
                    <Input
                      {...register(bucketNameFieldName)}
                      id="target-bucket-name"
                      autoComplete="off"
                    />
                  }
                />
                <FormGroup
                  required
                  label="Role"
                  id="target-role"
                  error={roleTouched ? roleError?.message : undefined}
                  help="Fill this with the ARN of the role created on the destination during the CRR Location preparation steps"
                  helpErrorPosition="bottom"
                  content={
                    <Input
                      {...register(roleFieldName)}
                      id="target-role"
                      autoComplete="off"
                      placeholder="arn:aws:iam::123456789012:role/ExampleRole"
                    />
                  }
                />
              </>
            )}
            <PreferredReadLocationSelector
              isTransient={isTransient}
              control={control}
              options={options}
              destinationLocations={destinationLocations}
              locations={locations}
              name={`${prefix}preferredReadLocation`}
            />
          </>
          );
        }}
      />
    </FormSection>
  );
};

type PreferredReadLocationSelectorProps = {
  isTransient: boolean;
  control: Control<FieldValues, string>;
  options: SelectOption[];
  destinationLocations: string[];
  locations: LocationInfo[];
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
        //@ts-expect-error fix this when you are working on it
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
