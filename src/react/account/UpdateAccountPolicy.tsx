import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router';
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
import { MouseEvent } from 'react';
import { useBasenameRelativeNavigate } from '@scality/module-federation';

type FormValues = {
  policyName: string;
  policyDocument: string;
};

const UpdateAccountPolicy = () => {
  const IAMClient = useIAMClient();
  const navigate = useBasenameRelativeNavigate();
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
  } = useForm<FormValues>({ mode: 'onChange' });
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
    ...getPolicyQuery(policyArn, defaultVersionId, IAMClient),
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
        await IAMClient.deletePolicyVersion(
          policyArn,
          policyVersions.Versions[policyVersions.Versions.length - 1].VersionId,
        );
      }
      return IAMClient.createPolicyVersion(policyArn, policyDocument);
    },
    {
      onSuccess: () => {
        queryClient.refetchQueries(
          getListPoliciesQuery(notFalsyTypeGuard(account).Name, IAMClient),
        );
        queryClient.refetchQueries(
          getListPolicyVersionsQuery(policyArn, IAMClient),
        );
        navigate(`/accounts/${account?.Name}/policies`);
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
    updatePolicyMutation.mutate({ policyDocument });
  };

  const handleCancel = (e: MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    navigate(`/accounts/${account?.Name}/policies`);
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
      //@ts-expect-error fix this when you are working on it
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
