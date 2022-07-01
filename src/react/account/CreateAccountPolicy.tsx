import * as F from '../ui-elements/FormLayout';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { getListPoliciesQuery } from '../queries';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useIAMClient } from '../IAMProvider';

import { useHistory, useParams } from 'react-router-dom';
import { handleApiError, handleClientError } from '../actions';
import { useDispatch } from 'react-redux';
import { ApiError } from '../../types/actions';
import { CommonPolicyLayout } from './AccountEditCommonLayout';

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
    formState: { isDirty, errors },
  } = useForm<PolicyFormValues>({
    defaultValues,
  });

  const watchAllFields = watch();

  const createPolicyMutation = useMutation(
    ({ policyName, policyDocument }: PolicyFormValues) => {
      return notFalsyTypeGuard(IAMClient).createPolicy(
        policyName,
        policyDocument,
      );
    },
    {
      onSuccess: () => {
        history.push(`/accounts/${accountName}/policies`);
        queryClient.invalidateQueries(
          getListPoliciesQuery(accountName, notFalsyTypeGuard(IAMClient))
            .queryKey,
        );
      },
      onError: (error) => {
        try {
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

  const handleCancel = (e: MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    history.goBack();
  };

  return (
    <CommonPolicyLayout
      control={control}
      handleCancel={handleCancel}
      isDirty={isDirty}
      onSubmit={handleSubmit(onSubmit)}
      policyDocument={watchAllFields.policyDocument}
      policyNameField={
        <>
          <F.Input
            type="text"
            data-testid="policyNameInput"
            autoFocus
            readOnly={false}
            {...register('policyName', {
              required: 'The policy name is required',
            })}
            style={{ width: '20rem', flexGrow: 1 }}
          />
          {errors?.policyName && <F.ErrorInput id="error-name" hasError={errors?.policyName}>
            <> {errors?.policyName?.message} </>
          </F.ErrorInput>}
        </>
      }
      errors={errors}
    />
  );
};

export default CreateAccountPolicy;
