import FormContainer, * as F from '../ui-elements/FormLayout';
import React, { useRef } from 'react';
import { clearError, createAccount } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { goBack } from 'connected-react-router';
import { joiResolver } from '@hookform/resolvers/joi';
import { useForm } from 'react-hook-form';
import { useOutsideClick } from '../utils/hooks';
const regexpEmailAddress = /^\S+@\S+.\S+$/;
const regexpName = /^[\w+=,.@ -]+$/;
const schema = Joi.object({
  name: Joi.string()
    .label('Name')
    .required()
    .min(2)
    .max(64)
    .regex(regexpName)
    .message('Invalid Name'),
  email: Joi.string()
    .label('Root Account Email')
    .required()
    .max(256)
    .regex(regexpEmailAddress)
    .message('Invalid Root Account Email'),
});

function AccountCreate() {
  const {
    register,
    handleSubmit,

    formState: {
      errors,
    },
  } = useForm({
    resolver: joiResolver(schema),
  });
  const hasError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const dispatch = useDispatch();

  const onSubmit = ({ email, name }) => {
    clearServerError();
    const payload = {
      userName: name,
      email,
    };
    dispatch(createAccount(payload));
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
    }

    clearServerError();
    dispatch(goBack());
  };

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };

  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
  useOutsideClick(formRef, clearServerError);
  return (
    <FormContainer>
      <F.Form
        autoComplete="off"
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
      >
        <F.Title> Create New Account </F.Title>
        <F.Fieldset>
          <F.Label htmlFor="name" tooltipMessages={['Must be unique']} tooltipWidth="6rem">
            Name
          </F.Label>
          <F.Input
            type="text"
            id="name"
            {...register('name')}
            onChange={clearServerError}
            autoComplete="new-password"
            aria-invalid={!!errors.name}
            aria-describedby="error-name" />
          <F.ErrorInput id="error-name" hasError={errors.name}>
            {' '}
            {errors.name?.message}{' '}
          </F.ErrorInput>
        </F.Fieldset>
        <F.Fieldset>
          <F.Label
            htmlFor="email"
            tooltipMessages={[
              'Must be unique',
              'When a new Account is created, a unique email is attached as the Root owner of this account, for initial authentication purpose',
            ]}
            tooltipWidth="20rem"
          >
            Root Account Email
          </F.Label>
          <F.Input
            type="email"
            id="email"
            {...register('email', { onChange: clearServerError })}
            aria-invalid={!!errors.email}
            aria-describedby="error-email"
            />
          <F.ErrorInput id="error-email" hasError={errors.email}>
            {' '}
            {errors.email?.message}{' '}
          </F.ErrorInput>
        </F.Fieldset>
        <F.Footer>
          <F.FooterError>
            {hasError && (
              <Banner
                id="zk-error-banner"
                icon={<i className="fas fa-exclamation-triangle" />}
                title="Error"
                variant="danger"
              >
                {errorMessage}
              </Banner>
            )}
          </F.FooterError>
          <F.FooterButtons>
            <Button
              disabled={loading}
              type="button"
              variant="outline"
              onClick={handleCancel}
              label="Cancel"
            />
            <Button
              disabled={loading}
              type="submit"
              id="create-account-btn"
              variant="primary"
              label="Create"
            />
          </F.FooterButtons>
        </F.Footer>
      </F.Form>
    </FormContainer>
  );
}

export default AccountCreate;
