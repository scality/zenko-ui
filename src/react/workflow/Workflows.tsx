import * as L from '../ui-elements/ListLayout3';
import { useParams, useHistory, Redirect } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Breadcrumb } from '../ui-elements/Breadcrumb';
import { EmptyStateContainer } from '../ui-elements/Container';
import { Warning } from '../ui-elements/Warning';
import WorkflowContent from './WorkflowContent';
import WorkflowList from './WorkflowList';
import { useQuery, UseQueryResult } from 'react-query';
import { useManagementClient } from '../ManagementProvider';
import { getClients } from '../utils/actions';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { makeWorkflows, workflowListQuery } from '../queries';
import Loader from '../ui-elements/Loader';
import {
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
} from '../actions';
import { APIWorkflows } from '../../types/workflow';
import { useAccounts, useRolePathName } from '../utils/hooks';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import {
  BucketWorkflowExpirationV1,
  BucketWorkflowTransitionV2,
  ReplicationStreamInternalV1,
} from '../../js/managementClient/api';
import { Icon } from '@scality/core-ui';

type Filter = string[];

export function useWorkflowsWithSelect<T>(
  select: (workflows: APIWorkflows) => T,
  filters?: Filter,
): UseQueryResult<T, unknown> {
  const mgnt = useManagementClient();
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
  const { account } = useCurrentAccount();
  const accountId = account?.id;
  const rolePathName = useRolePathName();
  const dispatch = useDispatch();

  const workflowsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId,
      instanceId,
      rolePathName,
      () => {
        dispatch(networkStart('Loading workflows...'));
      },
      filters,
    ),
    onSettled: () => {
      dispatch(networkEnd());
    },
    select: select,
    onError: (error) => {
      try {
        dispatch(handleClientError(error));
      } catch (err) {
        dispatch(handleApiError(err, 'byModal'));
      }
    },
  });

  return workflowsQuery;
}

export function useWorkflows(filters?: Filter): UseQueryResult<
  {
    expirations: BucketWorkflowExpirationV1[];
    transitions: BucketWorkflowTransitionV2[];
    replications: ReplicationStreamInternalV1[];
  },
  unknown
> {
  return useWorkflowsWithSelect(
    (workflows: APIWorkflows) => ({
      replications: workflows
        .filter((w) => w.replication)
        .map((w) => w.replication),
      expirations: workflows
        .filter((w) => w.expiration)
        .map((w) => w.expiration),
      transitions: workflows
        .filter((w) => w.transition)
        .map((w) => w.transition),
    }),
    filters,
  );
}

export default function Workflows() {
  const history = useHistory();
  const { workflowId } = useParams<{ workflowId?: string }>();
  const { account } = useCurrentAccount();
  const accountName = account?.Name;
  const accounts = useAccounts();
  const bucketList = useSelector(
    (state: AppState) => state.s3.listBucketsResults.list,
  );

  const workflowListDataQuery = useWorkflowsWithSelect(makeWorkflows);

  const workflows = workflowListDataQuery.data ?? [];
  const isWorkflowsReady = workflowListDataQuery.data !== undefined;
  const noWorkflows = workflowListDataQuery?.data?.length === 0;

  if (accounts.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Account" size="5x" />}
          title="Before browsing your workflows, create your first account."
          btnTitle="Create Account"
          btnAction={() => history.push('/create-account')}
        />
      </EmptyStateContainer>
    );
  }

  const content = () => {
    if (bucketList.size === 0) {
      return (
        <EmptyStateContainer>
          <Warning
            centered={true}
            icon={<Icon name="Bucket" size="5x" />}
            title="Before browsing your workflows, create your first bucket."
            btnTitle="Create Bucket"
            btnAction={() =>
              history.push(`/accounts/${accountName}/create-bucket`)
            }
          />
        </EmptyStateContainer>
      );
    }

    if (!isWorkflowsReady) {
      return (
        <Loader>
          <div>Loading workflows</div>
        </Loader>
      );
    }

    // redirect to the first workflow.
    if (!noWorkflows && !workflowId) {
      return <Redirect to={`./workflows/${workflows[0].id}`} />;
    }

    if (workflows.length === 0) {
      return (
        <EmptyStateContainer>
          <Warning
            centered={true}
            icon={<Icon name="Replication" size="5x" />}
            title="Before browsing your workflows, create your first workflow."
            btnTitle="Create Workflow"
            btnAction={() =>
              history.push(`/accounts/${accountName}/workflows/create-workflow`)
            }
          />
        </EmptyStateContainer>
      );
    }

    return (
      <L.Body style={{ overflow: 'hidden' }}>
        <WorkflowList workflowId={workflowId} workflows={workflows} />
        <WorkflowContent
          bucketList={bucketList}
          wfSelected={workflows.find((w) => w.id === workflowId)}
        />
      </L.Body>
    );
  };

  return (
    <L.Container style={{ overflow: 'hidden' }}>
      <L.BreadcrumbContainer>
        <Breadcrumb />
      </L.BreadcrumbContainer>
      {content()}
    </L.Container>
  );
}
