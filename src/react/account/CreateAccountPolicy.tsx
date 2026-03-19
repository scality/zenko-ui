import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import type { MouseEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router';
import type { ApiError } from '../../types/actions';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useErrorHandler } from '../ErrorProvider';
import { useIAMClient } from '../IAMProvider';
import { getListPoliciesQuery } from '../queries';
import { errorParser } from '../utils';
import { CommonPolicyLayout } from './AccountEditCommonLayout';

type PolicyFormValues = {
  policyName: string;
  policyDocument: string;
};

const CreateAccountPolicy = () => {
  const IAMClient = useIAMClient();
  const basenameNavigate = useBasenameRelativeNavigate();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const queryClient = useQueryClient();
  const { handleClientError, showModalError } = useErrorHandler();
  const defaultValues = {
    policyName: '',
    policyDocument: `{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": "s3:ListAllMyBuckets",
          "Resource": "*"
        }
      ]
    }`,
  };
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { isDirty, isValid, errors },
  } = useForm<PolicyFormValues>({
    mode: 'all',
    defaultValues,
  });

  const policyDocument = watch('policyDocument');

  const createPolicyMutation = useMutation(
    ({ policyName, policyDocument }: PolicyFormValues) => {
      return IAMClient.createPolicy(policyName, policyDocument);
    },
    {
      onSuccess: () => {
        basenameNavigate(`/accounts/${currentAccount.account?.Name}/policies`);
        queryClient.invalidateQueries({
          queryKey: getListPoliciesQuery(currentAccount.account?.Name, IAMClient).queryKey,
          refetchInactive: true,
        });
      },
      onError: (error) => {
        try {
          handleClientError(error as ApiError);
        } catch (err) {
          showModalError(errorParser(err as ApiError).message);
        }
      },
    },
  );

  const onSubmit = ({ policyName, policyDocument }: PolicyFormValues) => {
    createPolicyMutation.mutate({ policyName, policyDocument });
  };

  const handleCancel = (e: MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    navigate(-1);
  };

  return (
    <CommonPolicyLayout
      //@ts-expect-error fix this when you are working on it
      control={control}
      handleCancel={handleCancel}
      isDirty={isDirty}
      isValid={isValid}
      onSubmit={handleSubmit(onSubmit)}
      policyDocument={policyDocument}
      policyNameField={
        <Input
          type="text"
          id="policyName"
          readOnly={false}
          {...register('policyName', {
            required: 'The policy name is required',
          })}
        />
      }
      errors={errors}
    />
  );
};

export default CreateAccountPolicy;
