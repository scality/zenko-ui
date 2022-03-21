import * as T from '../ui-elements/TableKeyValue2';
import { Controller, useFormContext } from 'react-hook-form';
import { ErrorInput } from '../ui-elements/FormLayout';
import type {
  Locations,
  Replication as ReplicationStream,
  ReplicationStreams,
} from '../../types/config';
import React, { useEffect } from 'react';
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

import Input from '../ui-elements/Input';
import { NoLocationWarning } from '../ui-elements/Warning';
import type { S3BucketList } from '../../types/s3';

import styled from 'styled-components';

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
  replications: ReplicationStreams;
  bucketList: S3BucketList;
  locations: Locations;
  workflow: ReplicationStream | null | undefined;
};

function ReplicationComponent({
  replications,
  bucketList,
  locations,
  workflow,
}: Props) {
  // isCreateMode activate the tooltip
  const isCreateMode = workflow === null;

  const { register, errors, control, reset, getValues } = useFormContext();

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
          <T.GroupContent>
            <T.Row>
              <T.Key principal={true}> Rule Type </T.Key>
              <T.Value>
                <i className="fas fa-coins" />
                Replication
              </T.Value>
            </T.Row>
          </T.GroupContent>
        </T.Group>
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
                      replications,
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
