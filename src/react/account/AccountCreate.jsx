// @flow
import * as Form from '../ui-elements/FormLayout';
import { Banner, Button } from '@scality/core-ui';
import { accountEmailValidation, accountNameValidation, accountQuotaValidation } from '../utils/validator';
import { clearError, createAccount } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import Input from '../ui-elements/Input';
import React from 'react';
import { push } from 'connected-react-router';
import { useInput } from '../utils/hooks';


function AccountCreate() {
    const { value: name, onChange: onChangeName, errorMessage: errorName, hasError: hasErrorName, validation: validationName } = useInput('', accountNameValidation);
    const { value: email, onChange: onChangeEmail, errorMessage: errorEmail, hasError: hasErrorEmail, validation: validationEmail } = useInput('', accountEmailValidation);
    const { value: quotaMax, onChange: onChangeQuotaMax, errorMessage: errorQuota, hasError: hasErrorQuota, validation: validationQuota } = useInput('', accountQuotaValidation);

    const hasError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);

    const dispatch = useDispatch();

    const isValid = (): boolean => {
        const isValidName = validationName(name);
        const isValidEmail = validationEmail(email);
        const isValidQuota = validationQuota(quotaMax);
        return isValidName && isValidEmail && isValidQuota;
    };

    const submit = (e: SyntheticInputEvent<HTMLButtonElement>) => {
        if (e) {
            e.preventDefault();
        }
        if (hasError) {
            dispatch(clearError());
        }
        if (!isValid()) {
            return;
        }
        const quotaMaxInt =  quotaMax ? parseInt(quotaMax, 10) : 0;
        const payload = { userName: name, email, quotaMax: quotaMaxInt };
        dispatch(createAccount(payload));
    };

    const onChangeWithClearError = (e, onChange) => {
        if (hasError) {
            dispatch(clearError());
        }
        onChange(e);
    };

    const redirect = () => {
        // TODO: need to change redirect path
        dispatch(push('/'));
    };

    return <Form.Container autoComplete='off'>
        <Form.Title> create new account </Form.Title>
        <Form.Fieldset>
            <Form.Label tooltipMessages={['Must be unique']}>
                Name
            </Form.Label>
            <Form.InputContainer>
                <Input
                    type='text'
                    id='name'
                    value={name}
                    onChange={e => onChangeWithClearError(e, onChangeName)}
                    onBlur={e => validationName(e.target.value)}
                    hasError={hasErrorName}
                    autoComplete='new-password' />
            </Form.InputContainer>
            <Form.ErrorInput id='error-name' hasError={hasErrorName}> {errorName} </Form.ErrorInput>
        </Form.Fieldset>
        <Form.Fieldset>
            <Form.Label tooltipMessages={['Must be unique', 'When a new Account is created, a unique email is attached as the Root owner of this account, for initial authentication purpose']}>
                Root Account Email
            </Form.Label>
            <Form.InputContainer>
                <Input
                    type='text'
                    id='email'
                    value={email}
                    onChange={e => onChangeWithClearError(e, onChangeEmail)}
                    onBlur={e => validationEmail(e.target.value)}
                    hasError={hasErrorEmail}
                    autoComplete='off' />
            </Form.InputContainer>
            <Form.ErrorInput id='error-email' hasError={hasErrorEmail}> {errorEmail} </Form.ErrorInput>
        </Form.Fieldset>
        <Form.Fieldset>
            <Form.Label tooltipMessages={['Hard quota: the account cannot go over the limit', 'The limit can be changed after the creation', 'If the field is empty, there will be no limit']}>
                Quota in GB (optional)
            </Form.Label>
            <Form.InputContainer>
                <Input
                    type='number'
                    id='quota'
                    value={quotaMax}
                    onChange={e => onChangeWithClearError(e, onChangeQuotaMax)}
                    min="0"
                    onBlur={e => validationQuota(e.target.value)}
                    hasError={hasErrorQuota}
                    autoComplete='off' />
            </Form.InputContainer>
            <Form.ErrorInput id='error-quota' hasError={hasErrorQuota}> {errorQuota} </Form.ErrorInput>
        </Form.Fieldset>
        <Form.Footer>
            <Form.FooterError>
                {
                    hasError && <Banner
                        id="zk-error-banner"
                        icon={<i className="fas fa-exclamation-triangle" />}
                        title="Error"
                        variant="danger">
                        {errorMessage}
                    </Banner>
                }
            </Form.FooterError>
            <Form.FooterButtons>
                <Button variant="secondary" onClick={redirect} text='Cancel'/>
                <Button id='create-account-btn' variant="info" onClick={submit} text='Create'/>
            </Form.FooterButtons>
        </Form.Footer>
    </Form.Container>;
}

export default AccountCreate;
