import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { formatShortDate } from '../utils';
import { useIAMClient } from '../IAMProvider';
import CopyARNButton from '../ui-elements/CopyARNButton';
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
}: {
  policyName: string;
  policyPath: string;
  accountName: string;
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
          history.push(`/accounts/${accountName}/policies/${policyName}/update`)
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
  accountName,
}: {
  policyName: string;
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
            `/accounts/${accountName}/policies/${policyName}/attachments`,
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
  const { arn, policyName, policyPath } = rowValues;
  return (
    <Box display="flex">
      <AttachButton policyName={policyName} accountName={accountName} />
      <EditButton
        policyName={policyName}
        policyPath={policyPath}
        accountName={accountName}
      />
      <CopyARNButton text={arn} aria-label={`Copy ARN ${policyName}`} />
      <DeletePolicyAction
        policyName={policyName}
        path={policyPath}
        arn={arn}
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
  arn: string;
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
        queryResult.data?.map((user) => {
          return {
            policyPath: user.Path?.substring(1) || '',
            policyName: user.PolicyName || '',
            modifiedOn: user.UpdateDate
              ? formatShortDate(user.UpdateDate)
              : '-',
            attachments: user.AttachmentCount || 0,
            arn: user.Arn || '',
            actions: null,
          };
        }) || [];

      return iamPolicies;
    }
    return [];
  };

  const columns = [
    {
      Header: 'Policy Path',
      accessor: 'policyPath',
      cellStyle: {
        minWidth: '10rem',
      },
    },
    {
      Header: 'Policy Name',
      accessor: 'policyName',
      cellStyle: {
        minWidth: '18rem',
      },
      Cell: (value) => <AccessPolicyNameCell rowValues={value.row.original} />,
    },
    {
      Header: 'Last Modified',
      accessor: 'modifiedOn',
      cellStyle: {
        textAlign: 'right',
        minWidth: '10rem',
      },
    },
    {
      Header: 'Attachments',
      accessor: 'attachments',
      cellStyle: {
        textAlign: 'right',
        minWidth: '14rem',
      },
    },
    {
      Header: '',
      accessor: 'actions',
      cellStyle: {
        marginRight: 'auto',
        marginLeft: '22rem',
        minWidth: '5rem',
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
