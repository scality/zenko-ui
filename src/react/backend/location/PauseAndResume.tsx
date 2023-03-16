import { Icon } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { useMutation } from 'react-query';
import { useSelector } from 'react-redux';
import { AppState } from '../../../types/state';
import { WorkflowScheduleUnitState } from '../../../types/stats';
import { networkStart } from '../../actions';
import { InlineButton } from '../../ui-elements/Table';

export const PauseAndResume = ({
  locationName,
  ingestionStates,
  replicationStates,
  loading,
  dispatch,
  invalidateInstanceStatusQueryCache,
}: {
  locationName: string;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
  replicationStates: WorkflowScheduleUnitState | null | undefined;
  loading: boolean;
  dispatch: any;
  invalidateInstanceStatusQueryCache: () => void;
}) => {
  const ingestion =
    ingestionStates &&
    ingestionStates[locationName] &&
    ingestionStates[locationName];

  const replication =
    replicationStates && replicationStates[locationName]
      ? replicationStates[locationName]
      : null;

  const zenkoClient = useSelector((state: AppState) => state.zenko.zenkoClient);

  const pauseReplicationSiteMutation = useMutation(
    (locationName: string) => zenkoClient.pauseCrrSite(locationName),
    {
      onSuccess: () => {
        invalidateInstanceStatusQueryCache();
      },
    },
  );

  const resumeReplicationSiteMutation = useMutation(
    (locationName: string) => zenkoClient.resumeCrrSite(locationName),
    {
      onSuccess: () => {
        invalidateInstanceStatusQueryCache();
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

  if (replication || ingestion) {
    if (replication === 'enabled' || ingestion === 'enabled') {
      return (
        <Box display="flex" alignItems="center">
          <InlineButton
            disabled={loading}
            icon={<Icon name="Pause-circle" />}
            tooltip={{
              overlay: (
                <Box>
                  {replication === 'enabled' &&
                    'Replication workflow is active.'}
                  {ingestion === 'enabled' &&
                    'Async Metadata updates is active.'}
                </Box>
              ),
              placement: 'top',
            }}
            label="Pause"
            onClick={() => {
              if (replication === 'enabled') {
                dispatch(networkStart('Pausing Replication workflow'));
                pauseReplicationSiteMutation.mutate(locationName);
              }
              if (ingestion === 'enabled') {
                dispatch(networkStart('Pausing Async Metadata updates'));
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
              overlay: (
                <Box>
                  {replication === 'disabled' &&
                    'Replication workflow is paused.'}
                  {ingestion === 'disabled' &&
                    'Async Metadata updates is paused.'}
                </Box>
              ),
              placement: 'top',
            }}
            type="button"
            label="Resume"
            onClick={() => {
              if (replication === 'disabled') {
                dispatch(networkStart('Resuming Replication workflow'));
                resumeReplicationSiteMutation.mutate(locationName);
              }
              if (ingestion === 'disabled') {
                dispatch(networkStart('Resuming Async Metadata updates'));
                resumeIngestionSiteMutation.mutate(locationName);
              }
            }}
            variant="secondary"
          />
        </Box>
      );
    }
  }

  return <>-</>;
};
