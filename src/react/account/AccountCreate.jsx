import { Banner, Button } from '@scality/core-ui';
import FormContainer from '../ui-elements/FormContainer';
import Input from '../ui-elements/Input';
import React from 'react';
import { connect } from 'react-redux';
import { clearError, createAccount } from '../actions';
import { push } from 'connected-react-router';
import { useInput } from '../utils/hooks';

function AccountCreate(props) {
    const { value: name, onChange: onChangeName } = useInput('');
    const { value: email, onChange: onChangeEmail } = useInput('');
    const { value: quotaMax, onChange: onChangeQuotaMax } = useInput('');

    const submit = (e: SyntheticInputEvent<HTMLButtonElement>) => {
        if (e) {
            e.preventDefault();
        }
        if (props.hasError) {
            props.clearError();
        }
        const quotaMaxInt =  quotaMax ? parseInt(quotaMax, 10) : 0;
        const payload = { userName: name, email, quotaMax: quotaMaxInt };
        props.createAccount(payload);
    }

    const onChangeWithClearError = (e, onChange) => {
        if (props.hasError) {
            props.clearError();
        }
        onChange(e);
    }

    const redirect = () => {
        // TODO: need to change redirect path
        props.redirect('/');
    }

    return <FormContainer>
        <div className='zk-title'> create new account </div>
        <fieldset>
            <label htmlFor='accountName'> Name </label>
            <Input
                type='text'
                id='name'
                placeholder='name'
                value={name}
                onChange={e => onChangeWithClearError(e, onChangeName)}
                autoComplete='off' />
        </fieldset>
        <fieldset>
            <label htmlFor='accountName'>Email </label>
            <Input
                type='text'
                id='email'
                placeholder='email'
                value={email}
                onChange={e => onChangeWithClearError(e, onChangeEmail)}
                autoComplete='off' />
        </fieldset>
        <fieldset>
            <label htmlFor='accountName'> Quotas (GB) </label>
            <Input
                type='number'
                id='quotaMax'
                placeholder='0'
                value={quotaMax}
                onChange={e => onChangeWithClearError(e, onChangeQuotaMax)}
                min="0"
                autoComplete='off' />
        </fieldset>
        <div className='zk-footer'>
            <div className='zk-banner'>
                {
                    props.hasError && <Banner
                        icon={<i className="fas fa-exclamation-triangle" />}
                        title="Error"
                        variant="danger">
                        {props.errorMessage}
                    </Banner>
                }
            </div>
            <Button outlined onClick={redirect} text='Cancel'/>
            <Button outlined onClick={submit} text='Add'/>
        </div>
    </FormContainer>;
}

const mapStateToProps = state => {
    return {
        hasError: !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
        errorMessage: state.uiErrors.errorMsg,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        createAccount: payload =>  dispatch(createAccount(payload)),
        redirect: (path: string) => dispatch(push(path)),
        clearError: () => dispatch(clearError()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(AccountCreate);
