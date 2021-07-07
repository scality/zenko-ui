// @flow
import * as T from '../../ui-elements/TableKeyValue2';
import React, { useEffect, useMemo } from 'react';
import { Select, Toggle } from '@scality/core-ui';
import {
    convertToReplicationForm,
    destinationOptions,
    renderDestination,
    renderSource,
    sourceBucketOptions,
} from './utils';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Controller } from 'react-hook-form';
import { ErrorInput } from '../../ui-elements/FormLayout';
import Input from '../../ui-elements/Input';
import type { Locations } from '../../../types/config';
import { NoLocationWarning } from '../../ui-elements/Warning';
import type { Workflow } from '../../../types/workflow';
import { checkSupportsReplicationTarget } from '../../utils/storageOptions';
import { openWorkflowEditNotification } from '../../actions';

type Props = {
    locations: Locations,
    wfSelected: ?Workflow,
    createMode: boolean,
    loading: boolean,
    formProps: any,
};

function Replication({
    locations,
    wfSelected,
    createMode,
    formProps,
}: Props) {
    const dispatch = useDispatch();
    const workflowId = wfSelected ? wfSelected.workflowId : null;
    const replications = useSelector((state: AppState) => state.workflow.replications);
    const showEditWorkflowNotification = useSelector((state: AppState) => state.uiWorkflows.showEditWorkflowNotification);
    const bucketList = useSelector((state: AppState) => state.s3.listBucketsResults.list);
    const replication = useMemo(() => {
        return replications.find(r => r.streamId === workflowId);
    }, [replications, workflowId]);

    const { reset, control, errors, getValues, register } = formProps;

    useEffect(() => {
        reset(convertToReplicationForm(replication)); // asynchronously reset form values
    }, [reset, replication]);

    const handleChange = (onChange) => (e) => {
        if (!showEditWorkflowNotification) {
            dispatch(openWorkflowEditNotification());
        }
        onChange(e);
    };

    // TODO: make sure we do not delete bucket or location if replication created.
    if (!checkSupportsReplicationTarget(locations)) {
        return <NoLocationWarning/>;
    }

    return (
        <>
            <input
                type="hidden"
                id="workflowId"
                name="workflowId"
                ref={ register }
                autoComplete="off"
            />
            <input
                type="hidden"
                id="workflowVersion"
                name="workflowVersion"
                ref={ register }
                autoComplete="off"
            />
            <T.Group>
                <T.GroupName>
                    General
                </T.GroupName>
                <T.GroupContent>
                    {/* <T.Row>
                            <T.Key> Rule Name </T.Key>
                            <T.Value>
                                <Controller
                                    control={control}
                                    id='workflowName'
                                    name='workflowName'
                                    render={({ onChange, value: workflowName }) => {
                                        return <Input
                                            onChange={handleChange(onChange)}
                                            value={workflowName}
                                            autoComplete='off'
                                        />;
                                    }}
                                />
                                <T.ErrorContainer>
                                    <ErrorInput hasError={errors.workflowName}> {errors.workflowName?.message} </ErrorInput>
                                </T.ErrorContainer>
                            </T.Value>
                        </T.Row> */ }
                    <T.Row>
                        <T.Key> State </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="enabled"
                                name="enabled"
                                render={ ({ onChange, value: enabled }) => {
                                    return <Toggle
                                        toggle={ enabled }
                                        label={ enabled ? 'Active' : 'Inactive' }
                                        onChange={ () => handleChange(onChange)(!enabled) }
                                    />;
                                } }
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
                        <T.Key required={ createMode }> Bucket Name </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="sourceBucket"
                                name="sourceBucket"
                                render={ ({ onChange, value: sourceBucket }) => {
                                    const options = sourceBucketOptions(replications, bucketList, locations);
                                    const isEditing = !!getValues('workflowId');
                                    const result = options.find(l => l.value === sourceBucket.value);
                                    if (isEditing) {
                                        // TODO: To be removed once retrieving workflows per account:
                                        if (!result) {
                                            return <span> { sourceBucket.value } <small>(depreciated because entity does not exist) </small> </span>;
                                        }
                                        return renderSource(locations)(result);
                                    }
                                    return <Select
                                        onChange={ handleChange(onChange) }
                                        options={ options }
                                        formatOptionLabel={ renderSource(locations) }
                                        isDisabled={ isEditing }
                                        isOptionDisabled={ (option) => option.disabled === true }
                                        value={ result }
                                    />;
                                } }
                            />
                            <T.ErrorContainer>
                                <ErrorInput
                                    hasError={ errors.sourceBucket?.value }> { errors.sourceBucket?.value?.message } </ErrorInput>
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
                                control={ control }
                                id="sourcePrefix"
                                name="sourcePrefix"
                                render={ ({ onChange, value: sourcePrefix }) => {
                                    return <Input
                                        onChange={ handleChange(onChange) }
                                        value={ sourcePrefix }
                                        autoComplete="off"
                                    />;
                                } }
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
                        <T.Key required={ createMode }> Location Name </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="destinationLocation"
                                name="destinationLocation"
                                render={ ({ onChange, value: destinationLocation }) => {
                                    const options = destinationOptions(locations);
                                    return <Select
                                        onChange={ handleChange(onChange) }
                                        options={ options }
                                        formatOptionLabel={ renderDestination(locations) }
                                        value={ options.find(l => l.value === destinationLocation.value) }
                                    />;
                                } }
                            />
                            <T.ErrorContainer>
                                <ErrorInput
                                    hasError={ errors.destinationLocation?.value }> { errors.destinationLocation?.value?.message } </ErrorInput>
                            </T.ErrorContainer>
                        </T.Value>
                    </T.Row>
                </T.GroupContent>
            </T.Group>
        </>
    );
}

export default Replication;
