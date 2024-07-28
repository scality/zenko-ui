import {
  AppContainer,
  EmptyState,
  Icon,
  Stack,
  Text,
  TwoPanelLayout,
  Wrap,
  Loader,
} from '@scality/core-ui';
import { useEffect } from 'react';
import { UseQueryResult, useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { Redirect, useLocation, useParams } from 'react-router-dom';
import {
  BucketWorkflowExpirationV1,
  BucketWorkflowTransitionV2,
  ReplicationStreamInternalV1,
} from '../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { APIWorkflows } from '../../types/workflow';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useManagementClient } from '../ManagementProvider';
import {
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
} from '../actions';
import { useListBucketsForCurrentAccount } from '../next-architecture/domain/business/buckets';
import { useAuth, useInstanceId } from '../next-architecture/ui/AuthProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { makeWorkflows, workflowListQuery } from '../queries';
import { Breadcrumb } from '../ui-elements/Breadcrumb';

import { useAccounts, useRolePathName } from '../utils/hooks';
import WorkflowContent from './WorkflowContent';
import WorkflowList from './WorkflowList';
import {
  AuthorizedAdvancedMetricsButton,
  replicationDashboard,
} from '../endpoint/AdvancedMetricsButton';

type Filter = string[];

export function useWorkflowsWithSelect<T>(
  select: (workflows: APIWorkflows) => T,
  filters?: Filter,
): UseQueryResult<T, unknown> {
  const mgnt = useManagementClient();
  const instanceId = useInstanceId();
  const { account } = useCurrentAccount();
  const accountId = account?.id;
  const rolePathName = useRolePathName();
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  const workflowsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId,
      instanceId,
      rolePathName,
      getToken,
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
        //@ts-expect-error fix this when you are working on it
        dispatch(handleClientError(error));
      } catch (err) {
        dispatch(handleApiError(err, 'byModal'));
      }
    },
  });

  //In order to avoid races when we unmount before the promise
  //is resolved we force cleanup of network operation status in
  //redux on un-mount
  useEffect(() => {
    return () => {
      dispatch(networkEnd());
    };
  }, []);

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
  const params = useParams<{
    workflowId?: string;
  }>();
  const workflowId = params?.workflowId;
  const { account } = useCurrentAccount();
  const accountName = account?.Name;
  const { accounts } = useAccounts();
  const metricsAdapter = useMetricsAdapter();
  const { buckets } = useListBucketsForCurrentAccount({ metricsAdapter });
  const { search } = useLocation();

  const workflowListDataQuery = useWorkflowsWithSelect(makeWorkflows);

  const workflows = workflowListDataQuery.data ?? [];
  const isWorkflowsReady = workflowListDataQuery.data !== undefined;
  const noWorkflows = workflowListDataQuery?.data?.length === 0;
  const listedResource = {
    singular: 'Workflow',
    plural: 'Workflows',
  };
  if (accounts.length === 0) {
    return (
      <EmptyState
        icon="Workflow"
        link="/create-account"
        listedResource={listedResource}
        resourceToCreate="Account"
      ></EmptyState>
    );
  }

  const content = () => {
    if (buckets.status === 'success' && buckets.value.length === 0) {
      return (
        <EmptyState
          icon="Bucket"
          link={`/accounts/${accountName}/create-bucket`}
          listedResource={listedResource}
          resourceToCreate="Bucket"
        ></EmptyState>
      );
    }

    if (!isWorkflowsReady) {
      return (
        <Loader size="massive" centered>
          <div>Loading workflows</div>
        </Loader>
      );
    }

    // redirect to the first workflow.
    if (!noWorkflows && !workflowId) {
      const searchParams = new URLSearchParams(search);
      let firstWorkflowId = workflows[0].id;
      if (searchParams.has('search')) {
        const searchString = (searchParams.get('search') || '').toLowerCase();
        firstWorkflowId =
          workflows.find(
            (w) =>
              w.name.toLowerCase().includes(searchString) ||
              w.type.toLowerCase().includes(searchString),
          )?.id ?? firstWorkflowId;
      }
      return <Redirect to={`./workflows/${firstWorkflowId}${search}`} />;
    }

    if (workflows.length === 0) {
      return (
        <EmptyState
          icon="Workflow"
          link={`/accounts/${accountName}/workflows/create-workflow`}
          listedResource={listedResource}
        ></EmptyState>
      );
    }

    return (
      <>
        <AppContainer.OverallSummary>
          <Wrap style={{ alignItems: 'center' }}>
            <Stack gap="r16">
              <Icon name="Workflow" color="infoPrimary" size="2x" withWrapper />
              <Text variant="Larger">Workflows</Text>
            </Stack>
            <AuthorizedAdvancedMetricsButton dashboard={replicationDashboard} />
          </Wrap>
        </AppContainer.OverallSummary>
        <AppContainer.MainContent background="backgroundLevel3">
          <TwoPanelLayout
            panelsRatio="50-50"
            leftPanel={{
              children: (
                <WorkflowList workflowId={workflowId} workflows={workflows} />
              ),
            }}
            rightPanel={{
              children: (
                <WorkflowContent
                  wfSelected={workflows.find((w) => w.id === workflowId)}
                />
              ),
            }}
          />
        </AppContainer.MainContent>
      </>
    );
  };

  return (
    <>
      <AppContainer.ContextContainer background="backgroundLevel1">
        <Breadcrumb />
      </AppContainer.ContextContainer>

      {content()}
    </>
  );
}
