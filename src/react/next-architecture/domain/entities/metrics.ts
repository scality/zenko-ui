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
