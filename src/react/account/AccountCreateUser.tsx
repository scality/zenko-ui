import Joi from 'joi';
import { joiResolver } from '@hookform/resolvers/joi';
import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
} from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { MouseEvent, MouseEventHandler, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router';
import { useComponentError, useModalError } from '../ErrorProvider';
import {
  useCurrentAccount,
  useDataServiceRole,
} from '../DataServiceRoleProvider';
import { useIAMClient } from '../IAMProvider';
import { getListUsersQuery } from '../queries';
import { useOutsideClick } from '../utils/hooks';

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
  const navigate = useNavigate();
  const baseNameRelativeNavigate = useBasenameRelativeNavigate();
  const { accountName } = useParams<{ accountName: string }>();
  const IAMClient = useIAMClient();
  const { showModalError } = useModalError();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: { name: '' },
  });
  const queryClient = useQueryClient();

  const { account } = useCurrentAccount();
  const { roleArn } = useDataServiceRole();

  const createUserMutation = useMutation(
    (userName: string) => IAMClient.createUser(userName),
    {
      onSuccess: async () => {
        const targetAccountName = accountName || account.Name;
        await queryClient.refetchQueries(
          getListUsersQuery(targetAccountName, IAMClient, [roleArn]).queryKey,
        );

        baseNameRelativeNavigate(`/accounts/${targetAccountName}/users`);
      },
      onError: () => {
        showModalError('An error occurred during the user creation.');
      },
    },
  );

  const { componentError, clearComponentError } = useComponentError();
  const hasError = !!componentError;
  const errorMessage = componentError;
  const loading = createUserMutation.isLoading;

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
    navigate(-1);
  };

  const clearServerError = () => {
    if (hasError) {
      clearComponentError();
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
