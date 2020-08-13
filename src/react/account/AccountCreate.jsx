// @flow
import { Banner, Button } from '@scality/core-ui';
import Form, * as F from '../ui-elements/FormLayout';
import { clearError, createAccount } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import Joi from '@hapi/joi';
import React from 'react';
import { joiResolver } from '@hookform/resolvers';
import { push } from 'connected-react-router';
import { useForm } from 'react-hook-form';

const regexpEmailAddress = /^\S+@\S+.\S+$/;
const regexpName = /^[\w+=,.@ -]+$/;

const schema = Joi.object({
    name: Joi.string().label('Name').required().min(2).max(64).regex(regexpName).message('Invalid Name'),
    email: Joi.string().label('Root Account Email').required().max(256).regex(regexpEmailAddress).message('Invalid Root Account Email'),
    quota: Joi.number().label('Quota').allow('').optional().positive().integer(),
});

function AccountCreate() {
    const { register, handleSubmit, errors } = useForm({
        resolver: joiResolver(schema),
    });

    const hasError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);

    const dispatch = useDispatch();

    const onSubmit = ({ email, name, quota }) => {
        const quotaMaxInt =  quota || 0;
        const payload = { userName: name, email, quotaMax: quotaMaxInt };
        dispatch(createAccount(payload));
    };

    const clearServerError = () => {
        if (hasError) {
            dispatch(clearError());
        }
    };

    const redirect = () => {
        // TODO: need to change redirect path
        dispatch(push('/accounts'));
    };

    return <Form autoComplete='off'>
        <F.Title> create new account </F.Title>
        <F.Fieldset>
            <F.Label tooltipMessages={['Must be unique']}>
                Name
            </F.Label>
            <F.Input
                type='text'
                id='name'
                name='name'
                innerRef={register}
                // onChange={clearServerError}
                autoComplete='new-password' />
            <F.ErrorInput id='error-name' hasError={errors.name}> {errors.name?.message} </F.ErrorInput>
        </F.Fieldset>
        <F.Fieldset>
            <F.Label tooltipMessages={['Must be unique', 'When a new Account is created, a unique email is attached as the Root owner of this account, for initial authentication purpose']}>
                Root Account Email
            </F.Label>
            <F.Input
                type='text'
                id='email'
                name='email'
                innerRef={register}
                onChange={clearServerError}
                autoComplete='off' />
            <F.ErrorInput id='error-email' hasError={errors.email}> {errors.email?.message} </F.ErrorInput>
        </F.Fieldset>
        <F.Fieldset>
            <F.Label tooltipMessages={['Hard quota: the account cannot go over the limit', 'The limit can be changed after the creation', 'If the field is empty, there will be no limit']}>
                Quota in GB (optional)
            </F.Label>
            <F.Input
                type='number'
                id='quota'
                min="0"
                name='quota'
                innerRef={register}
                onChange={clearServerError}
                autoComplete='off' />
            <F.ErrorInput id='error-quota' hasError={errors.quota}> {errors.quota?.message} </F.ErrorInput>
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
                <Button variant="secondary" onClick={redirect} text='Cancel'/>
                <Button id='create-account-btn' variant="info" onClick={handleSubmit(onSubmit)} text='Create'/>
            </F.FooterButtons>
        </F.Footer>
    </Form>;
}

export default AccountCreate;
