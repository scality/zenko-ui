import Joi from '@hapi/joi';
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
import { MouseEventHandler } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { useCreateAccountMutation } from '../../js/mutations';
import { useSetAssumedRole } from '../DataServiceRoleProvider';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
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

  const setRole = useSetAssumedRole();
  const instanceId = useInstanceId();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });
  const createAccountMutation = useCreateAccountMutation();

  const loading =
    createAccountMutation.isLoading ||
    refetchAccountsLocationsEndpointsMutation.isLoading;
  const hasError =
    createAccountMutation.isError ||
    refetchAccountsLocationsEndpointsMutation.isError;
  const errorMessage =
    //@ts-expect-error fix this when you are working on it
    createAccountMutation.error?.message ??
    //@ts-expect-error fix this when you are working on it
    refetchAccountsLocationsEndpointsMutation.error?.message ??
    '';
  const queryClient = useQueryClient();
  const onSubmit = ({ name, email }: AccountFormField) => {
    createAccountMutation.mutate(
      {
        instanceId,
        user: { userName: name, email },
      },
      {
        onSuccess: (data) => {
          refetchAccountsLocationsEndpointsMutation.mutate(undefined, {
            onSuccess: () => {
              setRole({
                roleArn: `arn:aws:iam::${data.id}:role/scality-internal/storage-manager-role`,
              });
              queryClient.invalidateQueries(['WebIdentityRoles']);
              history.push(`/accounts/${name}`);
            },
          });
        },
      },
    );
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (e) {
      e.preventDefault();
    }

    history.goBack();
  };

  return (
    <Form
      autoComplete="off"
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
              {...register('name')}
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
          content={<Input type="email" id="email" {...register('email')} />}
        />
      </FormSection>
    </Form>
  );
}

export default AccountCreate;
