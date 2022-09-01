import * as T from '../ui-elements/TableKeyValue2';
import {
  Control,
  FieldValues,
  Controller,
  useFormContext,
  useFieldArray,
} from 'react-hook-form';
import { ErrorInput } from '../ui-elements/FormLayout';
import { AddButton, SubButton, Buttons } from '../ui-elements/EditableKeyValue';
import type { Locations } from '../../types/config';
import { Toggle } from '@scality/core-ui';
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
  renderDestination,
  renderSource,
  sourceBucketOptions,
} from './utils';
import Joi from '@hapi/joi';

import Input from '../ui-elements/Input';
import * as Inputs from '../ui-elements/Input';
import { NoLocationWarning } from '../ui-elements/Warning';
import type { S3BucketList } from '../../types/s3';

import styled from 'styled-components';
import { useQuery } from 'react-query';
import { workflowListQuery } from '../queries';
import { useSelector } from 'react-redux';
import { getClients } from '../utils/actions';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { AppState } from '../../types/state';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useRolePathName } from '../utils/hooks';

const ReplicationContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  ${T.Row} {
    height: 42px;
    min-height: 42px;
  }
`;

type Props = {
  bucketList: S3BucketList;
  locations: Locations;
  isCreateMode?: boolean;
  prefix?: string;
};

export const replicationSchema = {
  streamId: Joi.string().label('Id').allow(''),
  streamVersion: Joi.number().label('Version').optional(),
  // streamName: Joi.string().label('Name').min(4).allow('').messages({
  //     'string.min': '"Name" should have a minimum length of {#limit}',
  // }),
  enabled: Joi.boolean().label('State').required(),
  sourceBucket: Joi.string().label('Bucket Name').required(),
  sourcePrefix: Joi.string().label('Prefix').allow(''),
  destinationLocation: Joi.array()
    .items(Joi.string().label('Destination Location Name'))
    .min(1)
    .required(),
};

function ReplicationForm({
  prefix = '',
  bucketList,
  locations,
  isCreateMode,
}: Props) {
  const {
    register,
    control,
    getValues,
    trigger,
    formState: { errors: formErrors },
  } = useFormContext();
  const errors = flattenFormErrors(formErrors);

  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
  const { account } = useCurrentAccount();
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

  // TODO: make sure we do not delete bucket or location if replication created.
  if (
    !checkIfExternalLocation(locations) ||
    !checkSupportsReplicationTarget(locations)
  ) {
    return <NoLocationWarning />;
  }

  return (
    <ReplicationContainer>
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
      <T.Groups style={{ maxWidth: 'inherit' }}>
        <T.Group>
          <T.GroupName>General</T.GroupName>
          <T.GroupContent>
            <T.Row>
              <T.Key> State </T.Key>
              <T.Value>
                <Controller
                  control={control}
                  name={`${prefix}enabled`}
                  render={({ field: { onChange, value: enabled } }) => {
                    return (
                      <Toggle
                        toggle={enabled}
                        id="enabled"
                        label={enabled ? 'Active' : 'Inactive'}
                        onChange={() => {
                          onChange(!enabled);
                          trigger(`${prefix}enabled`);
                        }}
                        placeholder="isReplicationToggle"
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
            <T.Row data-testid="select-bucket-name-replication">
              <T.KeyTooltip
                required={isCreateMode}
                tooltipMessage={
                  isCreateMode
                    ? 'Source bucket has to be versioning enabled'
                    : ''
                }
                tooltipWidth="13rem"
              >
                Bucket Name
              </T.KeyTooltip>
              <T.Value>
                <Controller
                  control={control}
                  name={`${prefix}sourceBucket`}
                  render={({ field: { onChange, value: sourceBucket } }) => {
                    const options = sourceBucketOptions(
                      replicationsQuery.data || [],
                      bucketList,
                      locations,
                    );
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
                        id="sourceBucket"
                        value={sourceBucket}
                        onChange={onChange}
                        isDisabled={isEditing}
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
                <T.ErrorContainer>
                  <ErrorInput hasError={!!errors[`${prefix}sourceBucket`]}>
                    {' '}
                    {(errors[`${prefix}sourceBucket`] as any)?.message}{' '}
                  </ErrorInput>
                </T.ErrorContainer>
              </T.Value>
            </T.Row>
          </T.GroupContent>
        </T.Group>
        <T.Group>
          <T.GroupName>
            <i className="fas fa-filter"></i> Filter (optional)
          </T.GroupName>
          <T.GroupContent>
            <T.Row>
              <T.Key> Prefix </T.Key>
              <T.Value>
                <Controller
                  control={control}
                  name={`${prefix}sourcePrefix`}
                  render={({ field: { onChange, value: sourcePrefix } }) => {
                    return (
                      <Input
                        id="sourcePrefix"
                        onChange={onChange}
                        value={sourcePrefix}
                        autoComplete="off"
                      />
                    );
                  }}
                />
                <T.ErrorContainer>
                  <ErrorInput hasError={!!errors[`${prefix}sourcePrefix`]}>
                    {' '}
                    {errors[`${prefix}sourcePrefix`]?.message}{' '}
                  </ErrorInput>
                </T.ErrorContainer>
              </T.Value>
            </T.Row>
          </T.GroupContent>
        </T.Group>
        <RenderDestination
          prefix={prefix}
          control={control}
          name={`${prefix}destinationLocation`}
          isCreateMode={isCreateMode}
          locations={locations}
          errors={errors}
        />
      </T.Groups>
    </ReplicationContainer>
  );
}

const RenderDestination = ({
  prefix,
  control,
  name,
  isCreateMode,
  locations,
  errors,
}: {
  prefix: string;
  control: Control<FieldValues, string>;
  name: string;
  isCreateMode?: boolean;
  locations: Locations;
  errors: Record<string, any>;
}) => {
  return (
    <T.Group>
      <T.GroupName>Destination</T.GroupName>
      <T.GroupContent>
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, value: destinationLocations } }) => {
            if (!Array.isArray(destinationLocations)) return null;
            return destinationLocations.map((destLoc: string, index) => {
              const options = destinationOptions(locations);
              const err = errors[`${prefix}destinationLocation.${index}`];
              return (
                <T.Row data-testid="select-location-name-replication">
                  <T.Key required={index === 0 && isCreateMode}>
                    {index === 0 ? 'Location Name' : ''}
                  </T.Key>
                  <T.GroupValues>
                    <T.Value style={{ marginRight: 12 }}>
                      <Select
                        id="destinationLocation"
                        hasError={!!err}
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
                      <T.ErrorContainer>
                        <ErrorInput hasError={!!err}>
                          {' '}
                          {err?.message}{' '}
                        </ErrorInput>
                      </T.ErrorContainer>
                    </T.Value>
                    <Buttons>
                      <SubButton
                        disabled={destinationLocations[0] === ''}
                        index={index}
                        items={destinationLocations}
                        iconStyle={{}}
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
                        iconStyle={{}}
                        insertEntry={() => {
                          if (destinationLocations.includes('')) return;
                          onChange([...destinationLocations, '']);
                        }}
                      />
                    </Buttons>
                  </T.GroupValues>
                </T.Row>
              );
            });
          }}
        />
      </T.GroupContent>
    </T.Group>
  );
};

export default ReplicationForm;
