import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button, CopyButton } from '@scality/core-ui/dist/next';
import { useIAMClient } from '../IAMProvider';

import {
  ConstrainedText,
  Icon,
  Tooltip,
  spacing,
  FormattedDateTime,
} from '@scality/core-ui';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { getListPoliciesQuery, getListPolicyVersionsQuery } from '../queries';
import AwsPaginatedResourceTable from './AwsPaginatedResourceTable';
import IAMClient from '../../js/IAMClient';
import { useDispatch } from 'react-redux';
import { handleApiError, handleClientError } from '../actions';
import { ApiError } from '../../types/actions';
import { AWS_PAGINATED_ENTITIES } from '../utils/IAMhooks';
import { ListPoliciesResponse, Policy } from 'aws-sdk/clients/iam';
import { CoreUIColumn } from 'react-table';

const EditButton = ({
  policyName,
  policyPath,
  accountName,
  policyArn,
  defaultVersionId,
}: {
  policyName: string;
  policyPath: string;
  accountName: string;
  policyArn: string;
  defaultVersionId: string;
}) => {
  const history = useHistory();

  const IAMClient = useIAMClient();
  const { data, status } = useQuery(
    getListPolicyVersionsQuery(policyArn, IAMClient),
  );

  const isLatestVersionTheDefaultOne =
    data?.Versions?.[0].IsDefaultVersion || false;

  const isEditPolicyDisabled =
    policyPath === 'scality-internal/' || !isLatestVersionTheDefaultOne;

  return (
    <Box>
      {isEditPolicyDisabled && (
        <Button
          size="inline"
          style={{ width: '5rem' }}
          variant="secondary"
          label="View"
          icon={<Icon name="Eye" />}
          onClick={() =>
            history.push(
              `/accounts/${accountName}/policies/${encodeURIComponent(
                policyArn,
              )}/${defaultVersionId}/update-policy`,
            )
          }
          tooltip={{
            overlayStyle: {
              width: '16.5rem',
            },
            overlay:
              status === 'idle' || status === 'loading' || !data
                ? 'Disabled while loading...'
                : !isLatestVersionTheDefaultOne
                ? 'The latest version of the policy is not the default one, hence editing of the policy is disabled in the UI. Please use a S3 API client to edit the versions of this policy.'
                : '',
          }}
          aria-label={`View ${policyName}`}
        />
      )}
      {!isEditPolicyDisabled && (
        <Button
          size="inline"
          style={{ width: '5rem' }}
          disabled={
            status === 'idle' ||
            status === 'loading' ||
            status === 'error' ||
            !data ||
            !isLatestVersionTheDefaultOne
          }
          variant="secondary"
          label="Edit"
          icon={<Icon name="Pen" />}
          onClick={() =>
            history.push(
              `/accounts/${accountName}/policies/${encodeURIComponent(
                policyArn,
              )}/${defaultVersionId}/update-policy`,
            )
          }
          tooltip={{
            overlayStyle: {
              width: '16.5rem',
            },
            overlay:
              status === 'idle' || status === 'loading' || !data
                ? 'Disabled while loading...'
                : '',
          }}
          aria-label={`Edit ${policyName}`}
        />
      )}
    </Box>
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
    <Button
      size="inline"
      variant="secondary"
      label="Attach"
      icon={<Icon name="Link" />}
      onClick={() =>
        history.push(
          `/accounts/${accountName}/policies/${encodeURIComponent(
            policyArn,
          )}/attachments`,
        )
      }
      aria-label={`Attach ${policyName}`}
    />
  );
};

const ActionButtons = ({
  rowValues,
  accountName,
}: {
  rowValues: InternalPolicy;
  accountName: string;
}) => {
  const { policyArn, policyName, policyPath, defaultVersionId, attachments } =
    rowValues;
  return (
    <Box
      gap={spacing.r12}
      alignSelf="flex-end"
      display="flex"
      alignItems="center"
    >
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
        defaultVersionId={defaultVersionId}
      />
      <CopyButton
        size="inline"
        textToCopy={policyArn}
        label="ARN"
        variant="outline"
        aria-label={`Copy ARN ${policyName}`}
      />
      <DeletePolicyAction
        policyName={policyName}
        path={policyPath}
        arn={policyArn}
        accountName={accountName}
        attachments={attachments}
      />
    </Box>
  );
};

const DeletePolicyAction = ({
  policyName,
  path,
  arn,
  accountName,
  attachments,
}: {
  policyName: string;
  path: string;
  arn: string;
  accountName: string;
  attachments: number;
}) => {
  const dispatch = useDispatch();
  const IAMClient = useIAMClient();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const isInternalPolicy = path.includes('scality-internal');
  const deletePolicyMutation = useMutation(
    async (arn: string) => {
      const policyVersions = await IAMClient.listPolicyVersions(arn);

      if (policyVersions.Versions && policyVersions.Versions.length > 1) {
        const nonDefaultPolicyVersions = policyVersions.Versions.filter(
          (policyVersion) => !policyVersion.IsDefaultVersion,
        );
        await Promise.all(
          nonDefaultPolicyVersions.map(async (policyVersion) =>
            IAMClient.deletePolicyVersion(
              arn,
              notFalsyTypeGuard(policyVersion.VersionId),
            ),
          ),
        );
      }

      return IAMClient.deletePolicy(arn);
    },
    {
      onSuccess: () =>
        queryClient.invalidateQueries(
          getListPoliciesQuery(accountName, IAMClient).queryKey,
        ),
      onError: (error: ApiError) => {
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
          style={{ height: spacing.r24 }}
          disabled={!!attachments || isInternalPolicy}
          icon={<Icon name="Delete" />}
          label=""
          onClick={() => {
            setShowModal(true);
          }}
          variant="danger"
          tooltip={{
            placement: 'top',
            overlay: isInternalPolicy
              ? `You can't delete a predefined Scality policy`
              : attachments
              ? `You can't delete a policy with attachments`
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
  const styleProps = { style: { marginLeft: spacing.r16 } };
  return (
    <>
      {isInternalPolicy && (
        <ConstrainedText
          text={
            <Tooltip
              overlay={'This is a predefined Scality Policy'}
              overlayStyle={{ width: '13rem' }}
            >
              {policyName}{' '}
              <Icon
                name="Info"
                size="xs"
                color="buttonSecondary"
                {...styleProps}
              />
            </Tooltip>
          }
          lineClamp={2}
        />
      )}
      {!isInternalPolicy && (
        <>
          <ConstrainedText text={policyName} lineClamp={2} />
        </>
      )}
    </>
  );
};

type InternalPolicy = {
  policyPath: string;
  policyName: string;
  modifiedOn: string | Date;
  attachments: number;
  defaultVersionId: string;
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
            modifiedOn: policy.UpdateDate || '-',
            attachments: policy.AttachmentCount || 0,
            policyArn: policy.Arn || '',
            defaultVersionId: policy?.DefaultVersionId || '',
            actions: null,
          };
        }) || [];

      return iamPolicies;
    }
    return [];
  };

  const columns: CoreUIColumn<InternalPolicy>[] = [
    {
      Header: 'Policy Name',
      accessor: 'policyName',
      cellStyle: {
        flex: 1,
        width: 'unset',
        minWidth: '5rem',
      },
      Cell: (value) => <AccessPolicyNameCell rowValues={value.row.original} />,
    },
    {
      Header: 'Policy Path',
      accessor: 'policyPath',
      cellStyle: {
        flex: 0.5,
        minWidth: '5rem',
        width: 'unset',
      },
    },
    {
      Header: 'Last Modified',
      accessor: 'modifiedOn',
      cellStyle: {
        width: 'unset',
        textAlign: 'right',
        minWidth: '6rem',
        flex: 0.5,
      },
      Cell: ({ value }) => {
        if (typeof value === 'string') {
          return <>{value}</>;
        }
        return <FormattedDateTime format="date-time" value={value} />;
      },
    },
    {
      Header: 'Attachments',
      accessor: 'attachments',
      cellStyle: {
        width: 'unset',
        textAlign: 'right',
        minWidth: '5rem',
        flex: 0.5,
      },
    },
    {
      Header: '',
      accessor: 'actions',
      cellStyle: {
        minWidth: '25rem',
        paddingRight: spacing.r12,
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
      //@ts-expect-error fix this when you are working on it
      columns={columns}
      additionalHeaders={
        <Button
          icon={<Icon name="Create-add" color="textSecondary" />}
          label="Create Policy"
          variant="primary"
          onClick={() => history.push('create-policy')}
          type="submit"
        />
      }
      defaultSortingKey={'policyName'}
      //@ts-expect-error fix this when you are working on it
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
      }}
    />
  );
};

export default AccountPoliciesList;
