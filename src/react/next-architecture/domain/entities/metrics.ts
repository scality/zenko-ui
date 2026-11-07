export type LatestUsedCapacity =
  | {
      type: 'noMetrics';
    }
  | {
      type: 'error';
    }
  | {
      type: 'hasMetrics';
      usedCapacity: {
        current: number;
        nonCurrent: number;
      };
      measuredOn: Date;
    };

export type StorageUsageReport = {
  /** Bytes used, keyed by account name then by location name. */
  accounts: Record<string, Record<string, number>>;
  retrievedOn: Date;
};
