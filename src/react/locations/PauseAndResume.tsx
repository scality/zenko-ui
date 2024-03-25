import { Icon, Loader, spacing } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../types/state';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { getInstanceStatusQuery } from './queries';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';

export const PauseAndResume = ({ locationName }: { locationName: string }) => {
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);
  const previousStatusRef = useRef<{
    replication: 'enabled' | 'disabled' | null;
    ingestion: 'enabled' | 'disabled' | null;
  } | null>(null);
  const dispatch = useDispatch();
  const instanceId = useInstanceId();
  const managementClient = useManagementClient();
  const instanceStatusQuery = getInstanceStatusQuery(
    dispatch,
    notFalsyTypeGuard(managementClient),
    instanceId,
  );

  const zenkoClient = useSelector((state: AppState) => state.zenko.zenkoClient);

  const pauseReplicationSiteMutation = useMutation((locationName: string) => {
    return zenkoClient.pauseCrrSite(locationName);
  });

  const resumeReplicationSiteMutation = useMutation((locationName: string) => {
    return zenkoClient.resumeCrrSite(locationName);
  });

  const pauseIngestionSiteMutation = useMutation((locationName: string) =>
    //@ts-expect-error fix this when you are working on it
    zenkoClient.pauseIngestionSite(locationName),
  );

  const resumeIngestionSiteMutation = useMutation((locationName: string) =>
    //@ts-expect-error fix this when you are working on it
    zenkoClient.resumeIngestionSite(locationName),
  );

  const {
    data: instanceStatus,
    status,
    isFetching: loadingWorkflowStatus,
  } = useQuery({
    ...instanceStatusQuery,
    refetchInterval: isPollingEnabled ? 1_000 : Infinity,
  });

  const ingestionLocationsStatuses =
    instanceStatus?.metrics?.['ingest-schedule']?.states;
  const replicationLocationsStatuses =
    instanceStatus?.metrics?.['crr-schedule']?.states;
  const ingestionStatus =
    (ingestionLocationsStatuses && ingestionLocationsStatuses[locationName]) ||
    null;

  const replicationStatus =
    (replicationLocationsStatuses &&
      replicationLocationsStatuses[locationName]) ||
    null;

  //the previous replication or ingestion could be null, so we should ignore it while computing the polling.
  useMemo(() => {
    if (
      previousStatusRef.current &&
      previousStatusRef.current.ingestion !== ingestionStatus &&
      previousStatusRef.current.replication !== replicationStatus
    ) {
      setIsPollingEnabled(false);
    } else if (
      previousStatusRef.current &&
      previousStatusRef.current.ingestion !== ingestionStatus &&
      previousStatusRef.current.replication === null
    ) {
      setIsPollingEnabled(false);
    } else if (
      previousStatusRef.current &&
      previousStatusRef.current.replication !== ingestionStatus &&
      previousStatusRef.current.ingestion === null
    ) {
      setIsPollingEnabled(false);
    }
  }, [replicationStatus, ingestionStatus]);

  if (status === 'loading' || status === 'idle') {
    return (
      <Box display="flex">
        <Loader
          //@ts-expect-error fix this when you are working on it
          style={{ paddingRight: spacing.r8 }}
        />
        Loading
      </Box>
    );
  }

  const isLoadingButton = loadingWorkflowStatus || isPollingEnabled;

  const tooltip = (
    <Box>
      {replicationStatus === 'enabled' && 'Replication workflow is active.'}
      {ingestionStatus === 'enabled' && 'Async Metadata updates is active.'}
      {replicationStatus === 'disabled' && 'Replication workflow is paused.'}
      {ingestionStatus === 'disabled' && 'Async Metadata updates is paused.'}
    </Box>
  );

  if (replicationStatus === 'enabled' || ingestionStatus === 'enabled') {
    return (
      <Box display="flex">
        <Button
          size="inline"
          disabled={isLoadingButton}
          icon={isLoadingButton ? <Loader /> : <Icon name="Pause-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          label="Pause"
          onClick={() => {
            previousStatusRef.current = {
              replication: replicationStatus,
              ingestion: ingestionStatus,
            };
            if (replicationStatus === 'enabled') {
              pauseReplicationSiteMutation.mutate(locationName);
            }
            if (ingestionStatus === 'enabled') {
              pauseIngestionSiteMutation.mutate(locationName);
            }
            setIsPollingEnabled(true);
          }}
          variant="secondary"
          type="button"
        />
      </Box>
    );
  }

  if (replicationStatus === 'disabled' || ingestionStatus === 'disabled') {
    return (
      <Box display="flex">
        <Button
          size="inline"
          disabled={isLoadingButton}
          icon={isLoadingButton ? <Loader /> : <Icon name="Play-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          type="button"
          label="Resume"
          onClick={() => {
            previousStatusRef.current = {
              replication: replicationStatus,
              ingestion: ingestionStatus,
            };
            if (replicationStatus === 'disabled') {
              resumeReplicationSiteMutation.mutate(locationName);
            }
            if (ingestionStatus === 'disabled') {
              resumeIngestionSiteMutation.mutate(locationName);
            }
            setIsPollingEnabled(true);
          }}
          variant="secondary"
        />
      </Box>
    );
  }

  return <EmptyCell />;
};
