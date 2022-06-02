import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { formatShortDate } from '../utils';
import { useIAMClient } from '../IAMProvider';
import CopyButton from '../ui-elements/CopyButton';
import { Tooltip } from '@scality/core-ui';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useMutation } from 'react-query';
import { queryClient } from '../App';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { getListPoliciesQuery } from '../queries';
import { Icon } from '../ui-elements/Help';
import AwsPaginatedResourceTable from './AwsPaginatedResourceTable';
import IAMClient from '../../js/IAMClient';
import { useDispatch } from 'react-redux';
import { handleApiError, handleClientError } from '../actions';
import { ApiError } from '../../types/actions';
import { AWS_PAGINATED_ENTITIES } from '../utils/IAMhooks';
import { ListPoliciesResponse, Policy } from 'aws-sdk/clients/iam';

const STORAGE_ACCOUNT_OWNER_POLICY = 'storage-account-owner-policy';
const STORAGE_MANAGER_POLICY = 'storage-manager-policy';

const EditButton = ({
  policyName,
  policyPath,
  accountName,
  policyArn,
  DefaultVersionId,
}: {
  policyName: string;
  policyPath: string;
  accountName: string;
  policyArn: string;
  DefaultVersionId: string;
}) => {
  const history = useHistory();
  const isEditPolicyDisabled =
    [STORAGE_MANAGER_POLICY, STORAGE_ACCOUNT_OWNER_POLICY].includes(
      policyName,
    ) && policyPath === 'scality-internal/';
  return (
    <SpacedBox ml={12}>
      <Button
        style={{ height: spacing.sp24 }}
        disabled={isEditPolicyDisabled}
        variant="secondary"
        label="Edit"
        icon={<i className="fa fa-pen"></i>}
        onClick={() =>
          history.push(
            `/accounts/${accountName}/policies/${encodeURIComponent(
              policyArn,
            )}/${DefaultVersionId}/update-policy`,
          )
        }
        tooltip={{
          overlayStyle: {
            width: '16.5rem',
          },
          overlay: isEditPolicyDisabled
            ? 'You cannot edit a predefined Scality Policy'
            : '',
        }}
        aria-label={`Edit ${policyName}`}
      />
    </SpacedBox>
  );
};

const AttachButton = ({
  policyName,
  policyArn,
  accountName,
}: {
  policyName: string;
  policyArn: string;
  accountName: string;
}) => {
  const history = useHistory();
  return (
    <SpacedBox ml={12}>
      <Button
        style={{ height: spacing.sp24 }}
        variant="secondary"
        label="Attach"
        icon={<i className="fas fa-link"></i>}
        onClick={() =>
          history.push(
            `/accounts/${accountName}/policies/${encodeURIComponent(
              policyArn,
            )}/attachments`,
          )
        }
        aria-label={`Attach ${policyName}`}
      />
    </SpacedBox>
  );
};

const ActionButtons = ({
  rowValues,
  accountName,
}: {
  rowValues: InternalPolicy;
  accountName: string;
}) => {
  const { policyArn, policyName, policyPath, DefaultVersionId } = rowValues;
  return (
    <Box display="flex" marginLeft="auto">
      <AttachButton
        policyName={policyName}
        accountName={accountName}
        policyArn={policyArn}
      />
      <EditButton
        policyName={policyName}
        policyPath={policyPath}
        policyArn={policyArn}
        accountName={accountName}
        DefaultVersionId={DefaultVersionId}
      />
      <CopyButton
        text={policyArn}
        labelName={'ARN'}
        aria-label={`Copy ARN ${policyName}`}
      />
      <DeletePolicyAction
        policyName={policyName}
        path={policyPath}
        arn={policyArn}
        accountName={accountName}
      />
    </Box>
  );
};

const DeletePolicyAction = ({
  policyName,
  path,
  arn,
  accountName,
}: {
  policyName: string;
  path: string;
  arn: string;
  accountName: string;
}) => {
  const dispatch = useDispatch();
  const IAMClient = useIAMClient();
  const [showModal, setShowModal] = useState(false);
  const isInternalPolicy = path.includes('scality-internal');
  const deletePolicyMutation = useMutation(
    (arn: string) => {
      return notFalsyTypeGuard(IAMClient).deletePolicy(arn);
    },
    {
      onSuccess: () =>
        queryClient.invalidateQueries(
          getListPoliciesQuery(accountName, notFalsyTypeGuard(IAMClient))
            .queryKey,
        ),
      onError: (error) => {
        try {
          dispatch(handleClientError(error));
        } catch (err) {
          dispatch(handleApiError(err as ApiError, 'byModal'));
        }
      },
    },
  );

  return (
    <>
      <DeleteConfirmation
        show={showModal}
        cancel={() => setShowModal(false)}
        approve={() => {
          deletePolicyMutation.mutate(arn);
        }}
        titleText={`Permanently remove the following policy ${policyName} ?`}
      />
      <Box ml="0.6rem">
        <Button
          style={{ height: spacing.sp24 }}
          disabled={isInternalPolicy}
          icon={<i className="fas fa-trash" />}
          label=""
          onClick={() => {
            setShowModal(true);
          }}
          variant="danger"
          tooltip={{
            placement: 'top',
            overlay: isInternalPolicy
              ? 'You cannot delete a predefined Scality Policy'
              : 'Delete',
          }}
          aria-label={`Delete ${policyName}`}
        />
      </Box>
    </>
  );
};

const AccessPolicyNameCell = ({ rowValues }: { rowValues: InternalPolicy }) => {
  const { policyPath, policyName } = rowValues;
  const isInternalPolicy = policyPath.includes('scality-internal');
  return (
    <>
      {isInternalPolicy && (
        <Tooltip
          overlay={'This is a predefined Scality Policy'}
          overlayStyle={{
            width: '13rem',
          }}
        >
          {policyName} <Icon className="fas fa-question-circle fa-xs"></Icon>
        </Tooltip>
      )}
      {!isInternalPolicy && <>{policyName} </>}
    </>
  );
};

type InternalPolicy = {
  policyPath: string;
  policyName: string;
  modifiedOn: string;
  attachments: number;
  DefaultVersionId: string;
  policyArn: string;
  actions: null;
};

const AccountPoliciesList = ({ accountName }: { accountName: string }) => {
  const history = useHistory();
  const getQuery = (IAMClient?: IAMClient | null) =>
    getListPoliciesQuery(notFalsyTypeGuard(accountName), IAMClient);
  const getEntitiesFromResult = (data?: ListPoliciesResponse) =>
    data?.Policies || [];

  const prepareData = (
    queryResult: AWS_PAGINATED_ENTITIES<Policy>,
  ): InternalPolicy[] => {
    if (queryResult.firstPageStatus === 'success') {
      const iamPolicies =
        queryResult.data?.map((policy) => {
          return {
            policyPath: policy.Path?.substring(1) || '',
            policyName: policy.PolicyName || '',
            modifiedOn: policy.UpdateDate
              ? formatShortDate(policy.UpdateDate)
              : '-',
            attachments: policy.AttachmentCount || 0,
            policyArn: policy.Arn || '',
            DefaultVersionId: policy?.DefaultVersionId || '',
            actions: null,
          };
        }) || [];

      return iamPolicies;
    }
    return [];
  };

  const columns = [
    {
      Header: 'Policy Name',
      accessor: 'policyName',
      cellStyle: {
        minWidth: '20%',
      },
      Cell: (value) => <AccessPolicyNameCell rowValues={value.row.original} />,
    },
    {
      Header: 'Policy Path',
      accessor: 'policyPath',
      cellStyle: {
        minWidth: '10%',
      },
    },
    {
      Header: 'Last Modified',
      accessor: 'modifiedOn',
      cellStyle: {
        textAlign: 'right',
        minWidth: '10%',
      },
    },
    {
      Header: 'Attachments',
      accessor: 'attachments',
      cellStyle: {
        textAlign: 'right',
        minWidth: '10%',
      },
    },
    {
      Header: '',
      accessor: 'actions',
      cellStyle: {
        minWidth: '50%',
      },
      disableSortBy: true,
      Cell: (value) => (
        <ActionButtons
          rowValues={value.row.original}
          accountName={accountName}
        />
      ),
    },
  ];
  return (
    <AwsPaginatedResourceTable
      columns={columns}
      additionalHeaders={
        <Button
          icon={<i className="fas fa-plus" />}
          label="Create Policy"
          variant="primary"
          onClick={() => history.push('create-policy')}
          type="submit"
        />
      }
      defaultSortingKey={'policyName'}
      getItemKey={(index, iamPolicies) => {
        return iamPolicies[index].Arn;
      }}
      query={{
        getResourceQuery: getQuery,
        getEntitiesFromResult,
        prepareData,
      }}
      labels={{
        singularResourceName: 'policy',
        pluralResourceName: 'policies',
        loading: 'Loading policies...',
        disabledSearchWhileLoading: 'Search is disabled while loading policies',
        errorPreviousHeaders:
          'An error occured, policies listing may be incomplete. Please retry' +
          ' and if the error persist contact your support.',
        errorInTableContent:
          'We failed to retrieve policies, please retry later. If the error persists, please contact your support.',
      }}
    />
  );
};

export default AccountPoliciesList;
