import * as L from '../ui-elements/ListLayout3';
import { useParams, useHistory, Redirect } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { BreadcrumbWorkflow } from '../ui-elements/Breadcrumb';
import { EmptyStateContainer } from '../ui-elements/Container';
import { Warning } from '../ui-elements/Warning';
import WorkflowContent from './WorkflowContent';
import WorkflowList from './WorkflowList';
import { useQuery } from 'react-query';
import { useManagementClient } from '../ManagementProvider';
import { getAccountId, getClients } from '../utils/actions';
import { rolePathName } from '../../js/IAMClient';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { makeWorkflows, workflowListQuery } from '../queries';

import Loader from '../ui-elements/Loader';
import { handleApiError, handleClientError, networkEnd, networkStart } from '../actions';

export function useWorkflows() {
  const mgnt = useManagementClient();
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
  const accountId = getAccountId(state);
  const dispatch = useDispatch();

  const workflowsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId,
      instanceId,
      rolePathName,
      () => dispatch(networkStart('Loading workflows...'))
    ),
    onSettled: () => {dispatch(networkEnd());},
    select: (workflows) => ({
      replications: workflows
        .filter((w) => w.replication)
        .map((w) => w.replication),
      expirations: workflows
        .filter((w) => w.expiration)
        .map((w) => w.expiration),
    }),
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

export default function Workflows2() {
  const history = useHistory();
  const { workflowId } = useParams<{ workflowId?: string }>();
  const accountName = useSelector(
    (state: AppState) =>
      state.auth.selectedAccount && state.auth.selectedAccount.userName,
  );
  const accounts = useSelector(
    (state: AppState) => state.configuration.latest.users,
  );
  const bucketList = useSelector(
    (state: AppState) => state.s3.listBucketsResults.list,
  );
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
  const accountId = getAccountId(state);
  const dispatch = useDispatch();

  const mngt = useManagementClient();
  const workflowListDataQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mngt),
      accountId,
      instanceId,
      rolePathName,
      () => dispatch(networkStart('Loading workflows...'))
    ),
    onSettled: () => {dispatch(networkEnd());},
    onError: (error) => {
      try {
        dispatch(handleClientError(error));
      } catch (err) {
        dispatch(handleApiError(err, 'byModal'));
      }
    },
    select: (workflows) => makeWorkflows(workflows),
  });

  const workflows = workflowListDataQuery.data ?? [];
  const isWorkflowsReady = workflowListDataQuery.data !== undefined;
  const noWorkflows = workflowListDataQuery?.data?.length === 0;

  if (accounts.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          iconClass="fas fa-5x fa-wallet"
          title="Before browsing your workflow rules, create your first account."
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
            iconClass="fas fa-5x fa-glass-whiskey"
            title="Before browsing your workflow rules, create your first bucket."
            btnTitle="Create Bucket"
            btnAction={() => history.push('/create-bucket')}
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
            iconClass="fas fa-5x fa-coins"
            title="Before browsing your workflow rules, create your first rule."
            btnTitle="Create Rule"
            btnAction={() => history.push('./workflows/create-workflow')}
          />
        </EmptyStateContainer>
      );
    }

    return (
      <L.Body>
        <WorkflowList workflowId={workflowId} workflows={workflows} />
        <WorkflowContent
          bucketList={bucketList}
          wfSelected={workflows.find((w) => w.id === workflowId)}
        />
      </L.Body>
    );
  };

  return (
    <L.Container>
      <L.BreadcrumbContainer>
        <BreadcrumbWorkflow accounts={accounts} accountName={accountName} />
      </L.BreadcrumbContainer>
      {content()}
    </L.Container>
  );
}
