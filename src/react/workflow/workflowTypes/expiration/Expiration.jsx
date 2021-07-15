// @flow
import * as T from '../../../ui-elements/TableKeyValue2';
import React, { useEffect, useMemo } from 'react';
import { Toggle, Tooltip } from '@scality/core-ui';
import {
    convertToExpirationForm,
    renderSource,
    sourceBucketOptions,
} from './utils';
import type { AppState } from '../../../../types/state';
import { Controller } from 'react-hook-form';
import { ErrorInput } from '../../../ui-elements/FormLayout';
import { IconTooltip } from '../../../ui-elements/Icons';
import Input from '../../../ui-elements/Input';
import type { Locations } from '../../../../types/config';
import { Select } from '@scality/core-ui/dist/next';
import type { Workflow } from '../../../../types/workflow';
import { getLocationTypeShort } from '../../../utils/storageOptions';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

const Overlay = styled.div`
    width: 220px;
    padding: ${ spacing.sp8 };
    text-align: left;
`;

type Props = {
    locations: Locations,
    wfSelected: ?Workflow,
    createMode: boolean,
    handleChange: ((...event: any[]) => void) => (e: any) => void,
    formProps: any,
};

function Expiration({
    locations,
    wfSelected,
    createMode,
    handleChange,
    formProps,
}: Props) {
    const workflowId = wfSelected ? wfSelected.workflowId : null;
    const expirations = useSelector((state: AppState) => state.workflow.expirations);
    const bucketList = useSelector((state: AppState) => state.s3.listBucketsResults.list);
    const expiration = useMemo(() => {
        return expirations.find(e => e.workflowId === workflowId);
    }, [expirations, workflowId]);

    const { errors, control, reset, setValue, watch } = formProps;

    const expireCurrentVersionDays: number = watch('expireCurrentVersionDays') || 1;
    const expirePreviousVersionDays: number = watch('expirePreviousVersionDays') || 1;
    const expireCurrentVersionState: boolean = watch('expireCurrentVersionState');
    const expirePreviousVersionState: boolean = watch('expirePreviousVersionState');

    useEffect(() => {
        reset(convertToExpirationForm(expiration)); // asynchronously reset form values
    }, [reset, expiration]);

    useEffect(() => {
        if (expireCurrentVersionState) {
            setValue('expireOrphanDeleteMarkerState', false);
        }
    }, [expireCurrentVersionState, setValue]);

    const actionForm = () => (
        <>
            <T.Group>
                <T.GroupName>
                    <i className="fas fa-upload"/> Source
                </T.GroupName>
                <T.GroupContent>
                    <T.Row>
                        <T.Key>
                            Bucket Name
                        </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="sourceBucket"
                                name="sourceBucket"
                                render={ ({ onChange, value: sourceBucket }) => {
                                    if (sourceBucket) {
                                        const options = sourceBucketOptions(expirations, bucketList);
                                        const result = options.find(l => l.value === sourceBucket.value);
                                        if (!createMode) {
                                            // TODO: To be removed once retrieving workflows per account:
                                            if (!result) {
                                                return <span> { sourceBucket.value } <small>(depreciated because entity does not exist) </small> </span>;
                                            }
                                            return renderSource(locations)(result);
                                        }
                                        return <Select
                                            onChange={ handleChange(onChange) }
                                            value={sourceBucket.value}
                                        >
                                            {options.map((opt, i) => (
                                                <Select.Option key={i} disabled={opt.disabled} value={opt.value}>
                                                    {`${opt.label} (${opt.location} / ${getLocationTypeShort(opt.location, locations)})`}
                                                </Select.Option>
                                            ))}
                                        </Select>;
                                    }
                                    return null;
                                } }
                            />
                            <T.ErrorContainer>
                                <ErrorInput hasError={ errors.sourceBucket?.value }> { errors.sourceBucket?.value?.message } </ErrorInput>
                            </T.ErrorContainer>
                        </T.Value>
                    </T.Row>
                </T.GroupContent>
            </T.Group>
            { createMode && <T.Separator/> }
            <T.Group>
                <T.GroupName>
                    Action
                </T.GroupName>
                <T.GroupContent>
                    <T.Row>
                        <T.Key>
                            Expire Current version of objects
                            <Tooltip overlay={
                                <Overlay>
                                    For version-enabled buckets, Amazon S3 adds a delete marker and the current version of an object is retained as a previous version.
                                    For non-versioned buckets, Amazon S3 permanently removes the object.
                                </Overlay>
                            }>
                                <IconTooltip/>
                            </Tooltip>
                        </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="expireCurrentVersionState"
                                name="expireCurrentVersionState"
                                render={ ({ onChange, value: expireCurrentVersionState }) => (
                                    <Toggle
                                        toggle={ expireCurrentVersionState }
                                        onChange={ () => handleChange(onChange)(!expireCurrentVersionState) }
                                    />
                                ) }
                            />
                        </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.SubKey>
                            <div>Expiration after</div>
                            <Controller
                                control={ control }
                                id="expireCurrentVersionDays"
                                name="expireCurrentVersionDays"
                                render={ ({ onChange, value: expireCurrentVersionDays }) => (
                                    <Input
                                        type="number"
                                        disabled={!expireCurrentVersionState}
                                        onChange={ handleChange(onChange) }
                                        onBlur={() => !expireCurrentVersionDays ? setValue('expireCurrentVersionDays', 1) : null}
                                        value={ expireCurrentVersionDays }
                                        autoComplete="off"
                                        min={ 1 }
                                    />
                                ) }
                            />
                            <div>days</div>
                        </T.SubKey>
                        <T.Value principal={ false }>
                            If the bucket is versioned, a delete marker will be added on
                            objects older than { expireCurrentVersionDays } days.<br/>
                            If the bucket is not versioned, the objects older
                            than { expireCurrentVersionDays } days will be permanently removed.
                        </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key>
                            Expire Previous version of objects
                            <Tooltip overlay={
                                <Overlay>
                                    The tooltip
                                </Overlay>
                            }>
                                <IconTooltip/>
                            </Tooltip>
                        </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="expirePreviousVersionState"
                                name="expirePreviousVersionState"
                                render={ ({ onChange, value: expirePreviousVersionState }) => (
                                    <Toggle
                                        toggle={ expirePreviousVersionState }
                                        onChange={ () => handleChange(onChange)(!expirePreviousVersionState) }
                                    />
                                ) }
                            />
                        </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.SubKey>
                            <div>Deletion after</div>
                            <Controller
                                control={ control }
                                id="expirePreviousVersionDays"
                                name="expirePreviousVersionDays"
                                render={ ({ onChange, value: expirePreviousVersionDays }) => (
                                    <Input
                                        type="number"
                                        disabled={!expirePreviousVersionState}
                                        onChange={ handleChange(onChange) }
                                        onBlur={() => !expirePreviousVersionDays ? setValue('expirePreviousVersionDays', 1) : null}
                                        value={ expirePreviousVersionDays }
                                        autoComplete="off"
                                        min={ 1 }
                                    />
                                ) }
                            />
                            <div>days</div>
                        </T.SubKey>
                        <T.Value principal={ false }>
                            All the objects that become previous versions older
                            than { expirePreviousVersionDays } days will be permanently deleted
                        </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key>
                            Expire orphan delete markers
                            <Tooltip overlay={
                                <Overlay>
                                    An orphan delete markers is when all the previous version of an object has been expired.
                                    This option will improve the listing the object versions.
                                </Overlay>
                            }>
                                <IconTooltip/>
                            </Tooltip>
                        </T.Key>
                        <T.Value>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Controller
                                    control={ control }
                                    id="expireOrphanDeleteMarkerState"
                                    name="expireOrphanDeleteMarkerState"
                                    render={ ({ onChange, value: expireOrphanDeleteMarkerState }) => (
                                        <Toggle
                                            disabled={ expireCurrentVersionState }
                                            toggle={ expireOrphanDeleteMarkerState }
                                            onChange={ () => handleChange(onChange)(!expireOrphanDeleteMarkerState) }
                                        />
                                    ) }
                                />
                                { expireCurrentVersionState === true && 'This action is disabled when "Expire Current version of objects is active"' }
                            </div>
                        </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key>
                            Expire orphan MPU
                            <Tooltip overlay={
                                <Overlay>
                                    This action will stop all incomplete multipart uploads, and the parts associated with the multipart upload will be deleted.
                                </Overlay>
                            }>
                                <IconTooltip/>
                            </Tooltip>
                        </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="expireOrphanMPUState"
                                name="expireOrphanMPUState"
                                render={ ({ onChange, value: expireOrphanMPUState }) => (
                                    <Toggle
                                        toggle={ expireOrphanMPUState }
                                        onChange={ () => handleChange(onChange)(!expireOrphanMPUState) }
                                    />
                                ) }
                            />
                        </T.Value>
                    </T.Row>
                </T.GroupContent>
            </T.Group>
        </>
    );

    const filtersForm = () => (
        <>
            { createMode && <T.Separator/> }
            <T.Group>
                <T.GroupName>
                    <i className="fas fa-filter"/> Filters (optional)
                </T.GroupName>
                <T.GroupContent>
                    <T.Row>
                        <T.Key> Tag </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="objectKeyTag"
                                name="objectKeyTag"
                                render={ ({ onChange, value: objectKeyTag }) => {
                                    return <Input
                                        onChange={ handleChange(onChange) }
                                        value={ objectKeyTag }
                                        autoComplete="off"
                                    />;
                                } }
                            />
                            <T.ErrorContainer>
                                <ErrorInput hasError={ errors.objectKeyTag }> { errors.objectKeyTag?.message } </ErrorInput>
                            </T.ErrorContainer>
                        </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key> Prefix </T.Key>
                        <T.Value>
                            <Controller
                                control={ control }
                                id="objectKeyPrefix"
                                name="objectKeyPrefix"
                                render={ ({ onChange, value: objectKeyPrefix }) => {
                                    return <Input
                                        onChange={ handleChange(onChange) }
                                        value={ objectKeyPrefix }
                                        autoComplete="off"
                                    />;
                                } }
                            />
                            <T.ErrorContainer>
                                <ErrorInput hasError={ errors.objectKeyPrefix }> { errors.objectKeyPrefix?.message } </ErrorInput>
                            </T.ErrorContainer>
                        </T.Value>
                    </T.Row>
                </T.GroupContent>
            </T.Group>
        </>
    );

    const form = () => {
        if (createMode) {
            return <>
                {actionForm()}
                {filtersForm()}
            </>;
        } else {
            return <T.PrimaryGroupContainer>
                <T.SecondaryGroupContainer>
                    { actionForm() }
                </T.SecondaryGroupContainer>
                { filtersForm() }
            </T.PrimaryGroupContainer>;
        }
    };

    return (
        <>
            <T.Group>
                <T.GroupContent>
                    <T.Row>
                        <T.Key>
                            State
                            <Tooltip overlay={
                                <Overlay>State of Rule</Overlay>
                            }>
                                <IconTooltip/>
                            </Tooltip>
                        </T.Key>
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
                    <T.Row>
                        <T.Key>
                            Rule Name
                            <Tooltip overlay={ <Overlay>Lifecycle Rule Name</Overlay> }>
                                <IconTooltip/>
                            </Tooltip>
                        </T.Key>
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
                    </T.Row>
                </T.GroupContent>
            </T.Group>
            { createMode && <T.Separator/> }
            {form()}
        </>
    );
}

export default Expiration;
