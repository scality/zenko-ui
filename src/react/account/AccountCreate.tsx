import { MouseEventHandler, useRef } from 'react';
import { clearError, createAccount } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
} from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { useForm } from 'react-hook-form';
import { useOutsideClick } from '../utils/hooks';
import { useQueryClient } from 'react-query';
import { useSetAssumedRole } from '../DataServiceRoleProvider';
import { useHistory } from 'react-router-dom';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';

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

type AccountFormField = { name: string; email: string };

function AccountCreate() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormField>({
    mode: 'all',
    resolver: joiResolver(schema),
  });
  const history = useHistory();
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
  const queryClient = useQueryClient();
  const setRole = useSetAssumedRole();
  const token = useSelector((state: AppState) => state.oidc.user?.access_token);
  const instanceId = useInstanceId();
  const onSubmit = ({ name, email }: AccountFormField) => {
    clearServerError();
    const payload = {
      Name: name,
      email,
    };
    dispatch(
      createAccount(payload, queryClient, token, history, instanceId, setRole),
    );
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (e) {
      e.preventDefault();
    }

    clearServerError();
    history.goBack();
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
    <Form
      autoComplete="off"
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      layout={{ kind: 'page', title: 'Create New Account' }}
      requireMode="partial"
      rightActions={
        <Stack gap="r16">
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
        </Stack>
      }
      banner={
        hasError && (
          <Banner
            id="zk-error-banner"
            icon={<Icon name="Exclamation-triangle" />}
            title="Error"
            variant="danger"
          >
            {errorMessage}
          </Banner>
        )
      }
    >
      <FormSection>
        <FormGroup
          id="name"
          label="Name"
          direction="vertical"
          help="Must be unique"
          helpErrorPosition="bottom"
          error={errors.name?.message ?? ''}
          content={
            <Input
              type="text"
              id="name"
              {...register('name', { onChange: clearServerError })}
              autoFocus
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="email"
          label="Root Account Email"
          direction="vertical"
          helpErrorPosition="bottom"
          labelHelpTooltip="When a new Account is created, a unique email is attached as the Root owner of this account, for initial authentication purpose"
          error={errors.email?.message ?? ''}
          content={
            <Input
              type="email"
              id="email"
              {...register('email', { onChange: clearServerError })}
            />
          }
        />
      </FormSection>
    </Form>
  );
}

export default AccountCreate;
