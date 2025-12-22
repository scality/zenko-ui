import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ReplicationStatus = 'enabled' | 'disabled' | null;

type WaitingState = {
  isWaiting: boolean;
  previousStatus: {
    replication: ReplicationStatus;
    ingestion: ReplicationStatus;
  } | null;
};

type ReplicationControlContextValue = {
  getWaitingState: (locationName: string) => WaitingState;
  startWaiting: (
    locationName: string,
    previousStatus: { replication: ReplicationStatus; ingestion: ReplicationStatus },
  ) => void;
  stopWaiting: (locationName: string) => void;
};

const defaultWaitingState: WaitingState = {
  isWaiting: false,
  previousStatus: null,
};

const ReplicationControlContext = createContext<ReplicationControlContextValue | null>(null);

export const ReplicationControlProvider = ({ children }: { children: React.ReactNode }) => {
  const [waitingStates, setWaitingStates] = useState<Map<string, WaitingState>>(new Map());
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const getWaitingState = useCallback(
    (locationName: string): WaitingState => {
      return waitingStates.get(locationName) ?? defaultWaitingState;
    },
    [waitingStates],
  );

  const startWaiting = useCallback(
    (
      locationName: string,
      previousStatus: { replication: ReplicationStatus; ingestion: ReplicationStatus },
    ) => {
      const existingTimeout = timeoutRefs.current.get(locationName);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutRefs.current.delete(locationName);
      }

      setWaitingStates((prev) => {
        const next = new Map(prev);
        next.set(locationName, { isWaiting: true, previousStatus });
        return next;
      });
    },
    [],
  );

  const stopWaiting = useCallback((locationName: string) => {
    const existingTimeout = timeoutRefs.current.get(locationName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(locationName);
    }

    setWaitingStates((prev) => {
      const next = new Map(prev);
      next.delete(locationName);
      return next;
    });
  }, []);

  return (
    <ReplicationControlContext.Provider value={{ getWaitingState, startWaiting, stopWaiting }}>
      {children}
    </ReplicationControlContext.Provider>
  );
};

export const useReplicationControlContext = () => {
  const context = useContext(ReplicationControlContext);
  if (!context) {
    throw new Error(
      'useReplicationControlContext must be used within ReplicationControlProvider',
    );
  }
  return context;
};
