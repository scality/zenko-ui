import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory, useParams } from 'react-router';
import { useIAMClient } from '../IAMProvider';
import {
  getListPoliciesQuery,
  getListPolicyVersionsQuery,
  getPolicyQuery,
} from '../queries';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import Loader from '../ui-elements/Loader';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { regexArn } from '../utils/hooks';
import { CommonPolicyLayout } from './AccountEditCommonLayout';
import { ChangeEvent } from 'react';

type FormValues = {
  policyName: string;
  policyDocument: string;
};

const UpdateAccountPolicy = () => {
  const IAMClient = useIAMClient();
  const history = useHistory();
  const { policyArn: encodedPolicyArn, defaultVersionId } = useParams<{
    accountName: string;
    policyArn: string;
    defaultVersionId: string;
  }>();
  const { account } = useCurrentAccount();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty, isValid, errors },
    setValue,
    setError,
  } = useForm<FormValues>({});
  const policyDocument = watch('policyDocument');
  const policyArn = decodeURIComponent(encodedPolicyArn);
  const policyArnComponents = regexArn.exec(policyArn)?.groups;
  const policyName = policyArnComponents?.name;
  const policyPath = policyArnComponents?.path;

  const { data: policyVersions, status: listPolicyVersionsStatus } = useQuery(
    getListPolicyVersionsQuery(policyArn, IAMClient),
  );
  const isLatestVersionTheDefaultOne =
    policyVersions?.Versions?.[0].IsDefaultVersion || false;

  const isReadOnly =
    policyPath === 'scality-internal/' || !isLatestVersionTheDefaultOne;

  const queryClient = useQueryClient();
  const { data: policyResult, status } = useQuery({
    ...getPolicyQuery(
      policyArn,
      defaultVersionId,
      notFalsyTypeGuard(IAMClient),
    ),
    onSuccess: (data) => {
      const formattedDocument = JSON.stringify(
        JSON.parse(decodeURIComponent(data?.PolicyVersion?.Document ?? '')),
        null,
        2,
      );
      setValue('policyDocument', formattedDocument);
    },
  });

  const updatePolicyMutation = useMutation(
    async ({ policyDocument }: { policyDocument: string }) => {
      if (policyVersions?.Versions?.length === 5) {
        await notFalsyTypeGuard(IAMClient).deletePolicyVersion(
          policyArn,
          policyVersions.Versions[policyVersions.Versions.length - 1].VersionId,
        );
      }
      return notFalsyTypeGuard(IAMClient).createPolicyVersion(
        policyArn,
        policyDocument,
      );
    },
    {
      onSuccess: () => {
        queryClient.refetchQueries(
          getListPoliciesQuery(
            notFalsyTypeGuard(account).Name,
            notFalsyTypeGuard(IAMClient),
          ),
        );
        queryClient.refetchQueries(
          getListPolicyVersionsQuery(policyArn, notFalsyTypeGuard(IAMClient)),
        );
        history.push(`/accounts/${account?.Name}/policies`);
      },
      onError: (error) =>
        setError('policyDocument', {
          type: 'custom',
          message: `Update policy error: ${error}`,
        }),
    },
  );

  const onSubmit = (data: FormValues) => {
    const policyDocument = data.policyDocument;
    updatePolicyMutation.mutate({ policyName, policyDocument });
  };

  const handleCancel = (e: ChangeEvent<HTMLInputElement>) => {
    if (e) {
      e.preventDefault();
    }
    history.push(`/accounts/${account?.Name}/policies`);
  };

  if (
    (!policyResult && (status === 'idle' || status === 'loading')) ||
    (!policyVersions &&
      (listPolicyVersionsStatus === 'idle' ||
        listPolicyVersionsStatus === 'loading'))
  ) {
    return (
      <Loader>
        <div>Loading...</div>
      </Loader>
    );
  }

  return (
    <CommonPolicyLayout
      control={control}
      isDirty={isDirty}
      isValid={isValid}
      isReadOnly={isReadOnly}
      onSubmit={handleSubmit(onSubmit)}
      policyArn={policyArn}
      policyDocument={policyDocument}
      policyNameField={<span>{policyName}</span>}
      handleCancel={handleCancel}
      errors={errors}
    />
  );
};

export default UpdateAccountPolicy;
