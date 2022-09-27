import FormContainer, * as F from '../ui-elements/FormLayout';
import React, { useRef } from 'react';
import {
  clearError,
  handleErrorMessage,
  networkEnd,
  networkStart,
} from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Banner, Icon } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { goBack } from 'connected-react-router';
import { joiResolver } from '@hookform/resolvers/joi';
import { useForm } from 'react-hook-form';
import { useOutsideClick } from '../utils/hooks';
import { useIAMClient } from '../IAMProvider';
import { queryClient } from '../App';
import { useMutation } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { getListUsersQuery } from '../queries';
import { notFalsyTypeGuard } from '../../types/typeGuards';
const regexpName = /^[\w+=,.@ -]+$/;
const schema = Joi.object({
  name: Joi.string()
    .label('Name')
    .required()
    .min(2)
    .max(64)
    .regex(regexpName)
    .message('Invalid Name'),
});

const AccountCreateUser = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const IAMClient = useIAMClient();
  const {
    register,
    handleSubmit,

    formState: { errors },
  } = useForm({
    resolver: joiResolver(schema),
  });
  const { accountName } = useParams();
  const createAccessKeyMutation = useMutation(
    (userName) => {
      dispatch(networkStart('Creating User'));
      return IAMClient.createUser(userName)
        .then((newUser) => {
          queryClient.setQueryData(
            getListUsersQuery(accountName, notFalsyTypeGuard(IAMClient))
              ?.queryKey,
            (old) => {
              if (old) {
                const pages = old.pages;
                pages[pages.length - 1].Users.push({
                  ...newUser.User,
                  CreateDate: new Date(),
                });
                return { ...old, pages };
              }
            },
          );
        })
        .finally(() => {
          dispatch(networkEnd());
        });
    },
    {
      onSuccess: () => {
        history.push('./users');
      },
      onError: () => {
        const str = 'An error occurred during the user creation.';
        dispatch(handleErrorMessage(str, 'byModal'));
      },
    },
  );

  /**
   * This part has to be handle
   */
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

  const onSubmit = ({ name }) => {
    clearServerError();
    createAccessKeyMutation.mutate(name);
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
        <F.Title> Create New User </F.Title>
        <F.Fieldset>
          <F.Label tooltipMessages={['Must be unique']} tooltipWidth="6rem">
            Name
          </F.Label>
          <F.Input
            type="text"
            id="name"
            {...register('name', { onChange: clearServerError })}
            autoComplete="new-password"
          />
          <F.ErrorInput id="error-name" error={errors.name?.message} />
        </F.Fieldset>
        <F.Footer>
          <F.FooterError>
            {hasError && (
              <Banner
                id="zk-error-banner"
                icon={<Icon name="Exclamation-triangle" />}
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
};

export default AccountCreateUser;
