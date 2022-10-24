import { MouseEvent, useRef } from 'react';
import { clearError, handleErrorMessage, networkEnd } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Banner, Form, FormGroup, FormSection, Icon, Stack } from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { useForm } from 'react-hook-form';
import { useOutsideClick } from '../utils/hooks';
import { useIAMClient } from '../IAMProvider';
import { queryClient } from '../App';
import { InfiniteData, useMutation } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { ListUsersResponse } from 'aws-sdk/clients/iam';
import { getListUsersQuery } from '../queries';
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

//TODO this component is duplicated ith AccountCreateUser...
const AccountUpdateUser = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const IAMClient = useIAMClient();
  const { IAMUserName, accountName } = useParams<{
    IAMUserName: string;
    accountName: string;
  }>();
  const {
    register,
    handleSubmit,

    formState: { errors },
  } = useForm({
    resolver: joiResolver(schema),
    defaultValues: { name: IAMUserName },
  });
  const updateUserMutation = useMutation(
    (newUserName: string) => {
      const oldUserName = IAMUserName;
      return IAMClient.updateUser(newUserName, oldUserName)
        .then(() => {
          const olddata = queryClient.getQueryData(
            getListUsersQuery(accountName, IAMClient).queryKey,
          );
          olddata &&
            queryClient.setQueryData<InfiniteData<ListUsersResponse>>(
              getListUsersQuery(accountName, IAMClient).queryKey,
              (old) => {
                const pages = notFalsyTypeGuard(old).pages.map((page) => {
                  const users = page.Users;
                  const index = users.findIndex(
                    (user) => user.UserName === oldUserName,
                  );
                  if (index !== -1) {
                    users[index].UserName = newUserName;
                  }
                  return page;
                });
                return {
                  ...notFalsyTypeGuard(old),
                  pages,
                };
              },
            );
        })
        .catch((err) => {
          dispatch(handleErrorMessage(`${err}`, 'byModal'));
        })
        .finally(() => {
          dispatch(networkEnd());
        });
    },
    {
      onSuccess: () => {
        history.goBack();
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

  const onSubmit = ({ name }: { name: string }) => {
    clearServerError();
    updateUserMutation.mutate(name);
  };

  const handleCancel = (e: MouseEvent<HTMLButtonElement>) => {
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

  const formRef = useRef(null);
  useOutsideClick(formRef, clearServerError);
  return (
    <Form
      layout={{ title: 'Edit a User', kind: 'page' }}
      requireMode="all"
      ref={formRef}
      autoComplete="off"
      onSubmit={handleSubmit(onSubmit)}
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
            icon={<Icon name="Save" />}
            disabled={loading}
            type="submit"
            id="update-account-btn"
            variant="primary"
            label="Save"
          />
        </Stack>
      }
      banner={
        errorMessage && (
          <Banner
            variant="danger"
            icon={<Icon name="Exclamation-triangle" />}
            title={'Error'}
          >
            {errorMessage}
          </Banner>
        )
      }
    >
      <FormSection>
        <FormGroup
          label="User name"
          id="name"
          help="Must be unique"
          helpErrorPosition="bottom"
          labelHelpTooltip={
            <div style={{ textAlign: 'start' }}>
              <div>
                The ARN and the (friendly) name for the user will be edited, but
                the unique ID remains the same.
              </div>
              <br />
              <div>The User stays in the same Groups, under its new name.</div>
              <br />
              <div>Policies:</div>
              <div>
                - Any Policies attached to the user stays with this user, under
                its new name.
              </div>
              <div>
                - Any Role (Trust) Policies that refer to the User as a
                Principal are automatically updated with the new name.
              </div>
              <div>
                - Any Policies that refer to the User as a Resource are not
                updated, you have to do it manually.
              </div>
            </div>
          }
          content={
            <Input
              id="name"
              autoFocus
              {...register('name', { onChange: clearServerError })}
            />
          }
          required
          error={errors.name?.message}
        />
      </FormSection>
    </Form>
  );
};

export default AccountUpdateUser;
