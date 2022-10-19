import { MouseEvent, MouseEventHandler, useRef } from 'react';
import {
  clearError,
  handleErrorMessage,
  networkEnd,
  networkStart,
} from '../actions';
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
import { goBack } from 'connected-react-router';
import { joiResolver } from '@hookform/resolvers/joi';
import { useForm } from 'react-hook-form';
import { useOutsideClick } from '../utils/hooks';
import { useIAMClient } from '../IAMProvider';
import { queryClient } from '../App';
import { useMutation, InfiniteData } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { getListUsersQuery } from '../queries';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { CreateUserResponse, ListUsersResponse } from 'aws-sdk/clients/iam';

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
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: { name: '' },
  });

  const { accountName } = useParams<{ accountName: string }>();

  const createUserMutation = useMutation(
    (userName: string) => {
      dispatch(networkStart('Creating User'));
      return notFalsyTypeGuard(IAMClient)
        .createUser(userName)
        .then((newUser: CreateUserResponse) => {
          queryClient.setQueryData<InfiniteData<ListUsersResponse> | undefined>(
            getListUsersQuery(accountName, notFalsyTypeGuard(IAMClient))
              ?.queryKey,
            (old: InfiniteData<ListUsersResponse> | undefined) => {
              if (old) {
                const pages = old.pages;
                pages[pages.length - 1].Users.push({
                  ...notFalsyTypeGuard(newUser.User),
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

  const onSubmit = ({ name }: { name: string }) => {
    clearServerError();
    createUserMutation.mutate(name);
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = (
    e: MouseEvent<HTMLElement>,
  ) => {
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
    <Form
      layout={{ title: 'Create a User', kind: 'page' }}
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
            disabled={loading}
            type="submit"
            id="create-account-btn"
            variant="primary"
            label="Create"
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

export default AccountCreateUser;
