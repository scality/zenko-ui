import { Icon, Loader, spacing } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../types/state';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { networkEnd, networkStart } from '../../actions';
import { useManagementClient } from '../../ManagementProvider';
import { InlineButton } from '../../ui-elements/Table';
import { getInstanceStatusQuery } from './queries';

export const PauseAndResume = ({ locationName }: { locationName: string }) => {
  const dispatch = useDispatch();
  const instanceId = notFalsyTypeGuard(
    useSelector((state: AppState) => state.instances.selectedId),
  );
  const managementClient = useManagementClient();
  const queryClient = useQueryClient();
  const instanceStatusQuery = getInstanceStatusQuery(
    dispatch,
    notFalsyTypeGuard(managementClient),
    instanceId,
  );
  const invalidateInstanceStatusQueryCache = async () => {
    await queryClient.refetchQueries(instanceStatusQuery.queryKey);
    dispatch(networkEnd());
  };

  const zenkoClient = useSelector((state: AppState) => state.zenko.zenkoClient);

  const pauseReplicationSiteMutation = useMutation(
    (locationName: string) => {
      dispatch(networkStart('Pausing Async Metadata updates'));
      return zenkoClient.pauseCrrSite(locationName);
    },
    {
      onSuccess: () => {
        invalidateInstanceStatusQueryCache();
      },
      onError: () => {
        dispatch(networkEnd());
      },
    },
  );

  const resumeReplicationSiteMutation = useMutation(
    (locationName: string) => {
      dispatch(networkStart('Resuming Replication workflow'));
      return zenkoClient.resumeCrrSite(locationName);
    },
    {
      onSuccess: () => {
        invalidateInstanceStatusQueryCache();
      },
      onError: () => {
        dispatch(networkEnd());
      },
    },
  );

  const pauseIngestionSiteMutation = useMutation(
    (locationName: string) => zenkoClient.pauseIngestionSite(locationName),
    {
      onSuccess: () => {
        invalidateInstanceStatusQueryCache();
      },
    },
  );

  const resumeIngestionSiteMutation = useMutation(
    (locationName: string) => zenkoClient.resumeIngestionSite(locationName),
    {
      onSuccess: () => {
        invalidateInstanceStatusQueryCache();
      },
    },
  );

  const {
    data: instanceStatus,
    status,
    isFetching: loading,
  } = useQuery(instanceStatusQuery);

  if (status === 'loading' || status === 'idle') {
    return (
      <Box display="flex">
        <Loader style={{ paddingRight: spacing.r8 }} /> Loading
      </Box>
    );
  }

  const ingestionStates = instanceStatus?.metrics?.['ingest-schedule']?.states;
  const replicationStates = instanceStatus?.metrics?.['crr-schedule']?.states;
  const ingestion =
    ingestionStates &&
    ingestionStates[locationName] &&
    ingestionStates[locationName];

  const replication =
    replicationStates && replicationStates[locationName]
      ? replicationStates[locationName]
      : null;

  const tooltip = (
    <Box>
      {replication === 'enabled' && 'Replication workflow is active.'}
      {ingestion === 'enabled' && 'Async Metadata updates is active.'}
      {replication === 'disabled' && 'Replication workflow is paused.'}
      {ingestion === 'disabled' && 'Async Metadata updates is paused.'}
    </Box>
  );

  if (replication === 'enabled' || ingestion === 'enabled') {
    return (
      <Box display="flex" alignItems="center">
        <InlineButton
          disabled={loading}
          icon={<Icon name="Pause-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          label="Pause"
          onClick={() => {
            if (replication === 'enabled') {
              pauseReplicationSiteMutation.mutate(locationName);
            }
            if (ingestion === 'enabled') {
              pauseIngestionSiteMutation.mutate(locationName);
            }
          }}
          variant="secondary"
          type="button"
        />
      </Box>
    );
  }

  if (replication === 'disabled' || ingestion === 'disabled') {
    return (
      <Box display="flex" alignItems="center">
        <InlineButton
          disabled={loading}
          icon={<Icon name="Play-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          type="button"
          label="Resume"
          onClick={() => {
            if (replication === 'disabled') {
              resumeReplicationSiteMutation.mutate(locationName);
            }
            if (ingestion === 'disabled') {
              resumeIngestionSiteMutation.mutate(locationName);
            }
          }}
          variant="secondary"
        />
      </Box>
    );
  }

  return <>-</>;
};
