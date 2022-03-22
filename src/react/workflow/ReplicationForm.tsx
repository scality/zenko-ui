import * as T from '../ui-elements/TableKeyValue2';
import { Controller, useFormContext } from 'react-hook-form';
import { ErrorInput } from '../ui-elements/FormLayout';
import type {
  Locations,
  Replication as ReplicationStream,
} from '../../types/config';
import { useEffect } from 'react';
import { Select, Toggle } from '@scality/core-ui';
import {
  checkIfExternalLocation,
  checkSupportsReplicationTarget,
} from '../utils/storageOptions';
import {
  convertToReplicationForm,
  destinationOptions,
  renderDestination,
  renderSource,
  sourceBucketOptions,
} from './utils';
import Joi from '@hapi/joi';

import Input from '../ui-elements/Input';
import { NoLocationWarning } from '../ui-elements/Warning';
import type { S3BucketList } from '../../types/s3';

import styled from 'styled-components';
import { useQuery } from 'react-query';
import { workflowListQuery } from '../queries';
import { useSelector } from 'react-redux';
import { getAccountId, getClients } from '../utils/actions';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { rolePathName } from '../../js/IAMClient';

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
  workflow?: ReplicationStream;
};

export const replicationSchema = Joi.object({
  streamId: Joi.string().label('Id').allow(''),
  streamVersion: Joi.number().label('Version').optional(),
  // streamName: Joi.string().label('Name').min(4).allow('').messages({
  //     'string.min': '"Name" should have a minimum length of {#limit}',
  // }),
  enabled: Joi.boolean().label('State').required(),
  sourceBucket: Joi.object({
    value: Joi.string().label('Bucket Name').required(),
    label: Joi.string(),
    disabled: Joi.boolean(),
    location: Joi.string(),
  }),
  sourcePrefix: Joi.string().label('Prefix').allow(''),
  destinationLocation: Joi.object({
    value: Joi.string().label('Destination Location Name').required(),
    label: Joi.string(),
  }),
});

function ReplicationComponent({
  bucketList,
  locations,
  workflow,
}: Props) {
  // isCreateMode activate the tooltip
  const isCreateMode = workflow === null;

  const { register, errors, control, reset, getValues } = useFormContext();

  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
  const accountId = getAccountId(state);

  const mgnt = useManagementClient();

  const replicationsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId,
      instanceId,
      rolePathName,
    ),
    select: (workflows) => workflows.filter(w => w.replication).map(w => w.replication),
  });

  useEffect(() => {
    reset(convertToReplicationForm(workflow)); // asynchronously reset form values
  }, [reset, workflow]);

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
        name="streamId"
        ref={register}
        autoComplete="off"
      />
      <input
        type="hidden"
        id="streamVersion"
        name="streamVersion"
        ref={register}
        autoComplete="off"
      />
      <T.Groups>
        <T.Group>
          <T.GroupName>General</T.GroupName>
          <T.GroupContent>
            <T.Row>
              <T.Key> State </T.Key>
              <T.Value>
                <Controller
                  control={control}
                  id="enabled"
                  name="enabled"
                  render={({ onChange, value: enabled }) => {
                    return (
                      <Toggle
                        toggle={enabled}
                        label={enabled ? 'Active' : 'Inactive'}
                        onChange={() => onChange(!enabled)}
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
                  id="sourceBucket"
                  name="sourceBucket"
                  render={({ onChange, value: sourceBucket }) => {
                    const options = sourceBucketOptions(
                      replicationsQuery.data || [],
                      bucketList,
                      locations,
                    );
                    const isEditing = !!getValues('streamId');
                    const result = options.find(
                      (l) => l.value === sourceBucket?.value,
                    );

                    if (isEditing) {
                      // TODO: To be removed once retrieving workflows per account:
                      if (!result) {
                        return (
                          <span>
                            {' '}
                            {sourceBucket.value}{' '}
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
                        onChange={onChange}
                        options={options}
                        formatOptionLabel={renderSource(locations)}
                        isDisabled={isEditing}
                        isOptionDisabled={(option) => option.disabled === true}
                        value={result}
                      />
                    );
                  }}
                />
                <T.ErrorContainer>
                  <ErrorInput hasError={errors.sourceBucket?.value}>
                    {' '}
                    {errors.sourceBucket?.value?.message}{' '}
                  </ErrorInput>
                </T.ErrorContainer>
              </T.Value>
            </T.Row>
          </T.GroupContent>
        </T.Group>
        <T.Group>
          <T.GroupName>Filter (optional)</T.GroupName>
          <T.GroupContent>
            <T.Row>
              <T.Key> Prefix </T.Key>
              <T.Value>
                <Controller
                  control={control}
                  id="sourcePrefix"
                  name="sourcePrefix"
                  render={({ onChange, value: sourcePrefix }) => {
                    return (
                      <Input
                        onChange={onChange}
                        value={sourcePrefix}
                        autoComplete="off"
                      />
                    );
                  }}
                />
              </T.Value>
            </T.Row>
          </T.GroupContent>
        </T.Group>
        <T.Group>
          <T.GroupName>Destination</T.GroupName>
          <T.GroupContent>
            <T.Row>
              <T.Key required={isCreateMode}> Location Name </T.Key>
              <T.Value>
                <Controller
                  control={control}
                  id="destinationLocation"
                  name="destinationLocation"
                  render={({ onChange, value: destinationLocation }) => {
                    const options = destinationOptions(locations);
                    return (
                      <Select
                        onChange={onChange}
                        options={options}
                        formatOptionLabel={renderDestination(locations)}
                        value={options.find(
                          (l) => l.value === destinationLocation?.value,
                        )}
                      />
                    );
                  }}
                />
                <T.ErrorContainer>
                  <ErrorInput hasError={errors.destinationLocation?.value}>
                    {' '}
                    {errors.destinationLocation?.value?.message}{' '}
                  </ErrorInput>
                </T.ErrorContainer>
              </T.Value>
            </T.Row>
          </T.GroupContent>
        </T.Group>
      </T.Groups>
    </ReplicationContainer>
  );
}

export default ReplicationComponent;
