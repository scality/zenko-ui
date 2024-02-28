import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { getListPoliciesQuery } from '../queries';
import { useIAMClient } from '../IAMProvider';

import { useHistory, useParams } from 'react-router-dom';
import { handleApiError, handleClientError } from '../actions';
import { useDispatch } from 'react-redux';
import { ApiError } from '../../types/actions';
import { CommonPolicyLayout } from './AccountEditCommonLayout';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import { MouseEvent } from 'react';

type PolicyFormValues = {
  policyName: string;
  policyDocument: string;
};

const CreateAccountPolicy = () => {
  const IAMClient = useIAMClient();
  const history = useHistory();
  const { accountName } = useParams<{ accountName: string }>();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
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
        history.push(`/accounts/${accountName}/policies`);
        queryClient.invalidateQueries(
          getListPoliciesQuery(accountName, IAMClient).queryKey,
        );
      },
      onError: (error) => {
        try {
          //@ts-expect-error fix this when you are working on it
          dispatch(handleClientError(error));
        } catch (err) {
          dispatch(handleApiError(err as ApiError, 'byModal'));
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
    history.goBack();
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
