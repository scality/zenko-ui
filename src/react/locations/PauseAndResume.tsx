import { Icon, Loader, spacing } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { useZenkoClient } from '../ZenkoProvider';
import {
  INSTANCE_STATUS_QUERY_KEY,
  useInstanceStatusQuery,
} from '../queries/instanceStatusQuery';

const POLLING_INTERVAL_MS = 1_000;
const POLLING_TIMEOUT_MS = 15_000;

// Store loading states outside component to persist across remounts
type LoadingState = {
  isWaiting: boolean;
  previous: {
    replication: 'enabled' | 'disabled' | null;
    ingestion: 'enabled' | 'disabled' | null;
  } | null;
};
const loadingStatesMap = new Map<string, LoadingState>();

const getLoadingState = (locationName: string): LoadingState => {
  if (!loadingStatesMap.has(locationName)) {
    loadingStatesMap.set(locationName, { isWaiting: false, previous: null });
  }
  return loadingStatesMap.get(locationName)!;
};

/** @internal Exported for testing only */
export const _resetLoadingStates = () => {
  loadingStatesMap.clear();
};

const setLoadingState = (
  locationName: string,
  state: Partial<LoadingState>,
) => {
  const current = getLoadingState(locationName);
  loadingStatesMap.set(locationName, { ...current, ...state });
};

export const PauseAndResume = ({ locationName }: { locationName: string }) => {
  const externalState = getLoadingState(locationName);
  const [, forceUpdate] = useState(0);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zenkoClient = useZenkoClient();
  const queryClient = useQueryClient();

  const setIsWaitingForUpdate = (value: boolean) => {
    setLoadingState(locationName, { isWaiting: value });
    forceUpdate((c) => c + 1);
  };

  const setPreviousStatus = (
    value: {
      replication: 'enabled' | 'disabled' | null;
      ingestion: 'enabled' | 'disabled' | null;
    } | null,
  ) => {
    setLoadingState(locationName, { previous: value });
  };

  const isWaitingForUpdate = externalState.isWaiting;
  const previousStatus = externalState.previous;

  const { data: instanceStatus, isLoading } = useInstanceStatusQuery();

  const forceRefetch = async () => {
    await queryClient.refetchQueries([INSTANCE_STATUS_QUERY_KEY], {
      exact: false,
    });
    forceUpdate((c) => c + 1);
  };

  const stopPolling = () => {
    loadingStatesMap.delete(locationName);
    forceUpdate((c) => c + 1);
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  };

  const startPolling = () => {
    setIsWaitingForUpdate(true);
    pollingTimerRef.current = setTimeout(() => forceRefetch(), 500);
    timeoutTimerRef.current = setTimeout(stopPolling, POLLING_TIMEOUT_MS);
  };

  const pauseReplicationSiteMutation = useMutation({
    mutationFn: (locationName: string) =>
      zenkoClient.pauseCrrSite(locationName),
    onError: stopPolling,
  });

  const resumeReplicationSiteMutation = useMutation({
    mutationFn: (locationName: string) =>
      zenkoClient.resumeCrrSite(locationName),
    onError: stopPolling,
  });

  const pauseIngestionSiteMutation = useMutation({
    mutationFn: (locationName: string) =>
      zenkoClient.pauseIngestionSite(locationName),
    onError: stopPolling,
  });

  const resumeIngestionSiteMutation = useMutation({
    mutationFn: (locationName: string) =>
      zenkoClient.resumeIngestionSite(locationName),
    onError: stopPolling,
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

  useEffect(() => {
    if (!isWaitingForUpdate || !previousStatus) {
      return;
    }

    const prev = previousStatus;
    const replicationChanged =
      prev.replication !== null &&
      replicationStatus !== null &&
      prev.replication !== replicationStatus;
    const ingestionChanged =
      prev.ingestion !== null &&
      ingestionStatus !== null &&
      prev.ingestion !== ingestionStatus;

    if (replicationChanged || ingestionChanged) {
      stopPolling();
      return;
    }

    pollingTimerRef.current = setTimeout(() => {
      forceRefetch();
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, [isWaitingForUpdate, replicationStatus, ingestionStatus, previousStatus]);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, []);

  if (isLoading) {
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

  const tooltip = (
    <Box>
      {replicationStatus === 'enabled' && 'Replication is active.'}
      {ingestionStatus === 'enabled' && 'Async Metadata updates is active.'}
      {replicationStatus === 'disabled' && 'Replication is paused.'}
      {ingestionStatus === 'disabled' && 'Async Metadata updates is paused.'}
    </Box>
  );

  if (replicationStatus === 'enabled' || ingestionStatus === 'enabled') {
    return (
      <Box display="flex">
        <Button
          size="inline"
          disabled={isWaitingForUpdate}
          icon={isWaitingForUpdate ? <Loader /> : <Icon name="Pause-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          label="Pause"
          onClick={() => {
            setPreviousStatus({
              replication: replicationStatus,
              ingestion: ingestionStatus,
            });
            if (replicationStatus === 'enabled') {
              pauseReplicationSiteMutation.mutate(locationName);
            }
            if (ingestionStatus === 'enabled') {
              pauseIngestionSiteMutation.mutate(locationName);
            }
            startPolling();
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
          disabled={isWaitingForUpdate}
          icon={isWaitingForUpdate ? <Loader /> : <Icon name="Play-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          type="button"
          label="Resume"
          onClick={() => {
            setPreviousStatus({
              replication: replicationStatus,
              ingestion: ingestionStatus,
            });
            if (replicationStatus === 'disabled') {
              resumeReplicationSiteMutation.mutate(locationName);
            }
            if (ingestionStatus === 'disabled') {
              resumeIngestionSiteMutation.mutate(locationName);
            }
            startPolling();
          }}
          variant="secondary"
        />
      </Box>
    );
  }

  return <EmptyCell />;
};
