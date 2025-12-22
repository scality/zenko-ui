import { useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import { useZenkoClient } from '../../ZenkoProvider';
import { useInstanceStatusQuery } from '../../queries/instanceStatusQuery';
import { useReplicationControlContext } from '../contexts/ReplicationControlContext';
import { useErrorHandler } from '../../ErrorProvider';
import { errorParser } from '../../utils';
import { ApiError } from '../../../types/actions';

const POLLING_INTERVAL_MS = 1_000;
const POLLING_TIMEOUT_MS = 15_000;

type ReplicationStatus = 'enabled' | 'disabled' | null;

export const useLocationReplicationControl = (locationName: string) => {
  const zenkoClient = useZenkoClient();
  const { getWaitingState, startWaiting, stopWaiting } = useReplicationControlContext();
  const { handleClientError, showModalError } = useErrorHandler();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const waitingState = getWaitingState(locationName);
  const isWaitingForUpdate = waitingState.isWaiting;
  const previousStatus = waitingState.previousStatus;

  const { data: instanceStatus, isLoading } = useInstanceStatusQuery({
    refetchInterval: isWaitingForUpdate ? POLLING_INTERVAL_MS : false,
  });

  const ingestionLocationsStatuses =
    instanceStatus?.metrics?.['ingest-schedule']?.states;
  const replicationLocationsStatuses =
    instanceStatus?.metrics?.['crr-schedule']?.states;

  const ingestionStatus: ReplicationStatus =
    (ingestionLocationsStatuses && ingestionLocationsStatuses[locationName]) || null;
  const replicationStatus: ReplicationStatus =
    (replicationLocationsStatuses && replicationLocationsStatuses[locationName]) || null;

  const handleMutationStart = () => {
    startWaiting(locationName, {
      replication: replicationStatus,
      ingestion: ingestionStatus,
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      stopWaiting(locationName);
    }, POLLING_TIMEOUT_MS);
  };

  const handleMutationError = (error: unknown) => {
    stopWaiting(locationName);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    try {
      handleClientError(error as ApiError);
    } catch (err) {
      showModalError(errorParser(err as ApiError).message);
    }
  };

  const pauseReplicationMutation = useMutation({
    mutationFn: () => zenkoClient.pauseCrrSite(locationName),
    onError: handleMutationError,
  });

  const resumeReplicationMutation = useMutation({
    mutationFn: () => zenkoClient.resumeCrrSite(locationName),
    onError: handleMutationError,
  });

  const pauseIngestionMutation = useMutation({
    mutationFn: () => zenkoClient.pauseIngestionSite(locationName),
    onError: handleMutationError,
  });

  const resumeIngestionMutation = useMutation({
    mutationFn: () => zenkoClient.resumeIngestionSite(locationName),
    onError: handleMutationError,
  });

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
      stopWaiting(locationName);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [
    isWaitingForUpdate,
    replicationStatus,
    ingestionStatus,
    previousStatus,
    locationName,
    stopWaiting,
  ]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const pause = () => {
    handleMutationStart();
    if (replicationStatus === 'enabled') {
      pauseReplicationMutation.mutate();
    }
    if (ingestionStatus === 'enabled') {
      pauseIngestionMutation.mutate();
    }
  };

  const resume = () => {
    handleMutationStart();
    if (replicationStatus === 'disabled') {
      resumeReplicationMutation.mutate();
    }
    if (ingestionStatus === 'disabled') {
      resumeIngestionMutation.mutate();
    }
  };

  return {
    replicationStatus,
    ingestionStatus,
    isLoading,
    isUpdating: isWaitingForUpdate,
    pause,
    resume,
  };
};

