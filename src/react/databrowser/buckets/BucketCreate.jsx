// @flow
import { Banner, Button } from '@scality/core-ui';
import { Controller, useForm } from 'react-hook-form';
import Form, * as F from '../../ui-elements/FormLayout';
import React, { useMemo, useRef } from 'react';
import { clearError, createBucket } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers';
import { locationWithIngestion } from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { storageOptions } from '../../backend/location/LocationDetails';
import styled from 'styled-components';
import { useOutsideClick } from '../../utils/hooks';

const Select = styled(F.Select)`
    // to separate location name and location type.
    .sc-select__single-value{
        width: 100%;
    }
`;

const SelectOption = styled.div`
    // to separate location name and location type.
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    .float-right{
        font-size: 11px;
        margin-right: 10px;
    }
`;

const schema = Joi.object({
    name: Joi.string().label('Name').required().min(3).max(63),
    locationConstraint: Joi.object(),
});

function BucketCreate() {
    // TODO: redirect to list buckets if no account
    const { register, handleSubmit, errors, control } = useForm({
        resolver: joiResolver(schema),
    });

    const dispatch = useDispatch();

    const hasError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);

    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const capabilities = useSelector((state: AppState) => state.instanceStatus.latest.state.capabilities);

    const clearServerError = () => {
        if (hasError) {
            dispatch(clearError());
        }
    };
    // clear server errors if clicked on outside of element.
    const formRef = useRef(null);
    useOutsideClick(formRef, clearServerError);

    const onSubmit = ({ name, locationConstraint }) => {
        clearServerError();
        dispatch(createBucket({ name, locationConstraint: locationConstraint?.value }));
    };

    const handleCancel = () => {
        clearServerError();
        dispatch(push('/buckets'));
    };

    const renderLocation = (option) => {
        const locationType = option.locationType;
        const mirrorMode = option.mirrorMode;
        const locationTypeName = storageOptions[locationType].name;
        return (
            <SelectOption>
                {
                    mirrorMode ?
                        <span>{option.value.split(':ingest')[0]} <small>(Mirror mode)</small></span> :
                        <span>{option.value}</span>
                }
                <span className="float-right">{locationTypeName}</span>
            </SelectOption>
        );
    };

    const selectLocations = useMemo(() => {
        return locationWithIngestion(locations, capabilities);
    }, [locations, capabilities]);

    return <Form ref={formRef}>
        <F.Title> create a new bucket </F.Title>
        <F.Fieldset>
            <F.Label tooltipMessages={['Must be unique', 'Cannot be modified after creation']}>
                Bucket Name
            </F.Label>
            <F.Input
                type='text'
                id='name'
                name='name'
                ref={register}
                onChange={clearServerError}
                autoComplete='off' />
            <F.ErrorInput id='error-name' hasError={errors.name}> {errors.name?.message} </F.ErrorInput>
        </F.Fieldset>
        <F.Fieldset>
            <F.Label tooltipMessages={['Cannot be modified after creation']}>
                Select Storage Location
            </F.Label>
            <Controller
                control={control}
                id='locationConstraint'
                name='locationConstraint'
                defaultValue={{ value: 'us-east-1' }}
                render={({ onChange, value: locationConstraintObj }) => {
                    return <Select
                        onChange={onChange}
                        placeholder='Location Name'
                        options={selectLocations}
                        formatOptionLabel={renderLocation}
                        value={selectLocations.find(l => l.value === locationConstraintObj.value)}
                    />;
                }}
            />
        </F.Fieldset>
        <F.Footer>
            <F.FooterError>
                {
                    hasError && <Banner
                        id="zk-error-banner"
                        icon={<i className="fas fa-exclamation-triangle" />}
                        title="Error"
                        variant="danger">
                        {errorMessage}
                    </Banner>
                }
            </F.FooterError>
            <F.FooterButtons>
                <Button disabled={loading} id='cancel-btn' outlined onClick={handleCancel} text='Cancel'/>
                <Button disabled={loading} id='create-account-btn' variant="info" onClick={handleSubmit(onSubmit)} text='Create'/>
            </F.FooterButtons>
        </F.Footer>
    </Form>;
}

export default BucketCreate;
