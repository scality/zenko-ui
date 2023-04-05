export type LatestUsedCapacity =
  | {
      type: 'noMetrics';
    }
  | {
      type: 'hasMetrics';
      usedCapacity: {
        current: number;
        nonCurrent: number;
      };
      measuredOn: Date;
    };
