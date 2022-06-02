import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { formatShortDate } from '../utils';
import { useIAMClient } from '../IAMProvider';
import CopyARNButton from '../ui-elements/CopyARNButton';
import { Tooltip } from '@scality/core-ui';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useMutation, useQuery } from 'react-query';
import { queryClient } from '../App';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { Banner } from '@scality/core-ui';
import { getPoliciesQuery } from '../queries';
import { Icon } from '../ui-elements/Help';
import AwsPaginatedResourceTable from './AwsPaginatedResourceTable';
import IAMClient from '../../js/IAMClient';

const STORAGE_ACCOUNT_OWNER_POLICY = 'storage-account-owner-policy';
const STORAGE_MANAGER_POLICY = 'storage-manager-policy';

const RenderEditButton = ({ policyName, path }: { policyName: string, path: string }) => {
  const history = useHistory();
  const policyCondition = [STORAGE_MANAGER_POLICY,STORAGE_ACCOUNT_OWNER_POLICY].includes(policyName);
  const pathCondition = path.includes('scality-internal');
  const disableCondition = policyCondition && pathCondition;
  return (
    <SpacedBox ml={12}>
      <Button
        style={{ height: spacing.sp24 }}
        disabled={ disableCondition }
        variant='secondary'
        label='Edit'
        icon={<i className='fa fa-pen'></i>}
        onClick={() => history.push(`users/${policyName}/update-policy`)}
        tooltip={{
          overlayStyle: {
            width: '16.5rem',
          },
          overlay: disableCondition ? 'You cannot edit this predefined Scality Policy' : '',
        }}
      />
    </SpacedBox>);
};

const RenderAttachButton = () => {
  const history = useHistory();
  return (
    <SpacedBox ml={12}>
      <Button
        style={{ height: spacing.sp24 }}
        variant='secondary'
        label='Attach'
        icon={<i className='fas fa-link'></i>}
        onClick={() => history.push('attach-user-policy')}
      />
    </SpacedBox>);
};

const renderActionButtons = (rowValues, accountName) => {
  const { arn, policyName, policyPath } = rowValues;
  return (
    <Box display='flex'>
      <RenderAttachButton/>
      <RenderEditButton policyName={policyName} path={policyPath}/>
      <CopyARNButton text={arn} />
      <DeletePolicyAction policyName={policyName} path={policyPath} arn={arn} accountName={accountName}/>
    </Box>
  );
};

const DeletePolicyAction = (rowValue: { policyName : string , path: string, arn: string, accountName: string}) => {
  const { policyName, path, arn, accountName } = rowValue;
  const IAMClient = useIAMClient();
  const [showModal, setShowModal] = useState(false);
  const pathCondition = path.includes('scality-internal');
  const { status: listPoliciesStatus } = useQuery(getPoliciesQuery(policyName, notFalsyTypeGuard(IAMClient)));
  const deletePolicyMutation = useMutation(
    () => {
      return notFalsyTypeGuard(IAMClient)
        .deletePolicy(arn);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(getPoliciesQuery(accountName, notFalsyTypeGuard(IAMClient)).queryKey),
    },
  );

  return (
    <>
      <DeleteConfirmation
        show={showModal}
        cancel={() => setShowModal(false)}
        approve={() => {
          deletePolicyMutation.mutate(policyName);
        }}
        titleText={`Permanently remove the following policy ${policyName} ?`}
      />
      <Box ml='0.6rem'>
        <Button
          style={{ height: spacing.sp24 }}
          disabled
          icon={<i className='fas fa-trash' />}
          label=''
          onClick={() => {
            setShowModal(true);
          }}
          variant='danger'
          tooltip={{ overlay: (listPoliciesStatus === 'loading' || pathCondition) ? 'Delete':'You cannot delete a predefined Scality Policy' }}
        />
      </Box>
      {listPoliciesStatus === 'error' &&  <Banner
        icon={<i className="fas fa-exclamation-triangle" />}
        title="Error: Unable to delete policy"
        variant="danger"
      >
        Error: Unable to delete policy.
      </Banner>}
    </>
  );
};

const AccessPolicyNameCell = (rowValue) => {
  const {policyPath, policyName } = rowValue;
  const enableTooltip = policyPath.includes('scality-internal');
  return (
    <>
      {enableTooltip && <Tooltip
        overlay={'This is a predefined Scality Policy'}
        overlayStyle={{
          width: '12rem',
        }}
      >
        {policyName}{' '}
        <Icon className='fas fa-question-circle fa-xs'></Icon>
      </Tooltip>}
      {!enableTooltip && <>{policyName}{' '}</>}
    </>
  );
}

const AccountPoliciesList = ({ accountName }: { accountName?: string }) => {
  const history = useHistory();
  const getQuery = (IAMClient: IAMClient) => getPoliciesQuery(notFalsyTypeGuard(accountName), IAMClient);
  const getEntitiesFromResult = (data) => data.Policies;

  const prepareData = (queryResult, search) => {
    if (queryResult.firstPageStatus === 'success') {
      const iamPolicies = queryResult && queryResult.data && queryResult.data.map((policy) => {
        return {
          policyPath: policy?.Path.substring(1),
          policyName: policy?.PolicyName,
          modifiedOn: formatShortDate(policy?.CreateDate),
          attachments: policy?.AttachmentCount,
          arn: policy?.Arn,
          actions: null,
        };
      });
      if (search) {
        return iamPolicies.filter(policy =>
          Object.values(policy).find(val => val?.toString().toLowerCase().startsWith(search) )
        );
      }
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
      Cell: (value) => AccessPolicyNameCell(value.row.original),
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
      Cell: (value) => renderActionButtons(value.row.original, accountName),
    },
  ];
  return (
    <AwsPaginatedResourceTable
      columns={columns}
      additionalHeaders={<Button
        icon={<i className="fas fa-plus" />}
        label="Create Policy"
        variant="primary"
        onClick={() => history.push('create-policy')}
        type="submit"
      />}
      defaultSortingKey={'policyName'}
      getItemKey={(index, iamPolicies) => {
        return iamPolicies[index].Arn;
      }}
      query={{
        getResourceQuery: getQuery,
        getEntitiesFromResult,
        prepareData
      }}
      labels={{
        singularResourceName: 'policy',
        pluralResourceName: 'policies',
        loading: 'Loading policies...',
        disabledSearchWhileLoading: 'Search is disabled while loading policies',
        errorPreviousHeaders: 'An error occured, policies listing may be incomplete. Please retry' +
          ' and if the error persist contact your support.',
        errorInTableContent: 'We failed to retrieve policies, please retry later. If the error persists, please contact your support.',
      }}
    />
  );
};

export default AccountPoliciesList;
