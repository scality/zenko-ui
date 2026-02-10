export const BYTES_IN_TIB = 1024 ** 4;
export const BYTES_IN_PIB = 1024 ** 5;

export type StorageConsumptionLimitKind = 'TB' | 'PB';

export interface StorageConsumptionLimit {
  kind: StorageConsumptionLimitKind;
  count: number;
}

export function parseCapacityBytes(capacityBytes: string | number): number {
  const parsed = typeof capacityBytes === 'string' ? parseInt(capacityBytes, 10) : capacityBytes;

  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export function calculateStorageConsumptionLimit(capacityBytes: number): StorageConsumptionLimit {
  if (capacityBytes >= BYTES_IN_PIB) {
    return {
      kind: 'PB',
      count: Math.ceil(capacityBytes / BYTES_IN_PIB),
    };
  }

  if (capacityBytes >= BYTES_IN_TIB) {
    return {
      kind: 'TB',
      count: Math.ceil(capacityBytes / BYTES_IN_TIB),
    };
  }

  if (capacityBytes > 0) {
    return {
      kind: 'TB',
      count: 1,
    };
  }

  return {
    kind: 'TB',
    count: 0,
  };
}
