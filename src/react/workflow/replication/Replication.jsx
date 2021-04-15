// @noflow
import * as T from '../../ui-elements/TableKeyValue2';
import { Button, Select, Toggle } from '@scality/core-ui';
import { Controller, useForm } from 'react-hook-form';
import type { Locations, Replication as ReplicationStream } from '../../../config';
import { NoBucketWarning, NoLocationWarning } from '../../ui-elements/Warning';
import React, { useEffect } from 'react';
import { checkIfExternalLocation, checkSupportsReplicationTarget } from '../../utils/storageOptions';
import { convertToReplicationForm, convertToReplicationStream, destinationOptions, generateStreamName, newReplicationForm, renderDestination, renderSource, sourceBucketOptions } from './utils';
import { openWorkflowEditNotification, saveReplication } from '../../actions';
import { ErrorInput } from '../../ui-elements/FormLayout';
import Input from '../../ui-elements/Input';
import Joi from '@hapi/joi';
import type { ReplicationStreams } from '../../../types/replication';
import type { S3BucketList } from '../../../s3';
import { joiResolver } from '@hookform/resolvers';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const ReplicationContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    ${T.Row} {
      height: 42px;
      min-height: 42px;
    }
`;

const schema = Joi.object({
    streamId: Joi.string().label('Id').allow(''),
    streamVersion: Joi.number().label('Version').optional(),
    streamName: Joi.string().label('Name').min(4).allow('').messages({
        'string.min': '"Name" should have a minimum length of {#limit}',
    }),
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

type Props = {
    streams: ReplicationStreams,
    bucketList: S3BucketList,
    locations: Locations,
    workflowDetails: ?ReplicationStream,
    showEditWorkflowNotification: boolean,
    createMode: boolean,
    loading: boolean,
};
function Replication({ streams, bucketList, locations, workflowDetails, showEditWorkflowNotification, createMode, loading }: Props) {
    const dispatch = useDispatch();

    const { register, handleSubmit, errors, control, reset, getValues } = useForm({
        resolver: joiResolver(schema),
        defaultValues: newReplicationForm(),
    });

    useEffect(() => {
        reset(convertToReplicationForm(workflowDetails)); // asynchronously reset form values
    }, [reset, workflowDetails]);

    const onSubmit = (values) => {
        let stream = values;
        if (!stream.streamName) {
            stream = { ...values, streamName: generateStreamName(stream.sourceBucket.value, stream.destinationLocation.value) };
        }
        const s = convertToReplicationStream(stream);
        dispatch(saveReplication(s));
    };

    const handleCancel = () => {
        dispatch(push('/workflows'));
    };

    const handleChange = (onChange) => (e) => {
        if (!showEditWorkflowNotification) {
            dispatch(openWorkflowEditNotification());
        }
        onChange(e);
    };

    // TODO: make sure we do not delete bucket or location if replication created.
    if (bucketList.size === 0) {
        return <NoBucketWarning/>;
    }

    if (bucketList.size > 0 && (!checkIfExternalLocation(locations) ||
        !checkSupportsReplicationTarget(locations))) {
        return <NoLocationWarning/>;
    }

    return (
        <ReplicationContainer>
            <T.Groups>
                <T.Group>
                    <T.GroupContent>
                        <T.Row>
                            <T.Key principal={true}> Rule Type </T.Key>
                            <T.Value>
                                Replication
                            </T.Value>
                        </T.Row>
                    </T.GroupContent>
                </T.Group>
                <T.Group>
                    <T.GroupName>
                        General
                    </T.GroupName>
                    <T.GroupContent>
                        <T.Row>
                            <T.Key> Name </T.Key>
                            <T.Value>
                                <input type='hidden'
                                    id='streamId'
                                    name='streamId'
                                    ref={register}
                                    autoComplete='off'
                                />
                                <input type='hidden'
                                    id='streamVersion'
                                    name='streamVersion'
                                    ref={register}
                                    autoComplete='off'
                                />
                                <Controller
                                    control={control}
                                    id='streamName'
                                    name='streamName'
                                    render={({ onChange, value: streamName }) => {
                                        return <Input
                                            onChange={handleChange(onChange)}
                                            value={streamName}
                                            autoComplete='off'
                                        />;
                                    }}
                                />
                                <T.ErrorContainer>
                                    <ErrorInput hasError={errors.streamName}> {errors.streamName?.message} </ErrorInput>
                                </T.ErrorContainer>
                            </T.Value>
                        </T.Row>
                        <T.Row>
                            <T.Key> State </T.Key>
                            <T.Value>
                                <Controller
                                    control={control}
                                    id='enabled'
                                    name='enabled'
                                    render={({ onChange, value: enabled }) => {
                                        return <Toggle
                                            toggle={enabled}
                                            label={enabled ? 'active' : 'inactive'}
                                            onChange={() => handleChange(onChange)(!enabled)}
                                        />;
                                    }}
                                />
                            </T.Value>
                        </T.Row>
                    </T.GroupContent>
                </T.Group>

                <T.Group>
                    <T.GroupName>
                        Source
                    </T.GroupName>
                    <T.GroupContent>
                        <T.Row>
                            <T.Key>
                                Bucket Name
                            </T.Key>
                            <T.Value>
                                <Controller
                                    control={control}
                                    id='sourceBucket'
                                    name='sourceBucket'
                                    render={({ onChange, value: sourceBucket }) => {
                                        const options = sourceBucketOptions(streams, bucketList, locations);
                                        const isEditing = !!getValues('streamId');
                                        const result = options.find(l => l.value === sourceBucket.value);
                                        if (isEditing) {
                                            // TODO: To be removed once retrieving workflows per account:
                                            if (!result) {
                                                return <span> {sourceBucket.value} <small>(depreciated because entity does not exist) </small> </span>;
                                            }
                                            return renderSource(locations)(result);
                                        }
                                        return <Select
                                            onChange={handleChange(onChange)}
                                            options={options}
                                            formatOptionLabel={renderSource(locations)}
                                            isDisabled={isEditing}
                                            isOptionDisabled={(option) => option.disabled === true }
                                            value={result}
                                        />;
                                    }}
                                />
                                <T.ErrorContainer>
                                    <ErrorInput hasError={errors.sourceBucket?.value}> {errors.sourceBucket?.value?.message} </ErrorInput>
                                </T.ErrorContainer>
                            </T.Value>
                        </T.Row>
                    </T.GroupContent>
                </T.Group>
                <T.Group>
                    <T.GroupName>
                        Filter (optional)
                    </T.GroupName>
                    <T.GroupContent>
                        <T.Row>
                            <T.Key> Prefix </T.Key>
                            <T.Value>
                                <Controller
                                    control={control}
                                    id='sourcePrefix'
                                    name='sourcePrefix'
                                    render={({ onChange, value: sourcePrefix }) => {
                                        return <Input
                                            onChange={handleChange(onChange)}
                                            value={sourcePrefix}
                                            autoComplete='off'
                                        />;
                                    }}
                                />
                            </T.Value>
                        </T.Row>
                    </T.GroupContent>
                </T.Group>
                <T.Group>
                    <T.GroupName>
                        Destination
                    </T.GroupName>
                    <T.GroupContent>
                        <T.Row>
                            <T.Key> Location Name </T.Key>
                            <T.Value>
                                <Controller
                                    control={control}
                                    id='destinationLocation'
                                    name='destinationLocation'
                                    render={({ onChange, value: destinationLocation }) => {
                                        const options = destinationOptions(locations);
                                        return <Select
                                            onChange={handleChange(onChange)}
                                            options={options}
                                            formatOptionLabel={renderDestination(locations)}
                                            value={options.find(l => l.value === destinationLocation.value)}
                                        />;
                                    }}
                                />
                                <T.ErrorContainer>
                                    <ErrorInput hasError={errors.destinationLocation?.value}> {errors.destinationLocation?.value?.message} </ErrorInput>
                                </T.ErrorContainer>
                            </T.Value>
                        </T.Row>
                    </T.GroupContent>
                </T.Group>
            </T.Groups>
            <T.Footer>
                <Button disabled={loading || !createMode && !showEditWorkflowNotification} id='cancel-workflow-btn' style={{ marginRight: '8px' }} outlined onClick={handleCancel} text='Cancel'/>
                <Button disabled={loading || !createMode && !showEditWorkflowNotification} icon={<i className="fas fa-save" />} id='create-workflow-btn' variant="secondary" onClick={handleSubmit(onSubmit)} text={createMode ? 'Create' : 'Save Changes'}/>
            </T.Footer>
        </ReplicationContainer>
    );
}

export default Replication;
