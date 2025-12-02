export const BYTES_IN_MB = 1024 ** 2;
export const BYTES_IN_GB = 1024 ** 3;
export const BYTES_IN_TB = 1024 ** 4;
export const BYTES_IN_PB = 1024 ** 5;

export type CapacityUnit =
  | 'MiB'
  | 'MB'
  | 'GiB'
  | 'GB'
  | 'TiB'
  | 'TB'
  | 'PiB'
  | 'PB';
export type StorageConsumptionLimitKind = 'TB' | 'PB';

export interface CapacityInput {
  capacity?: string;
  capacityUnit?: string;
  capacityBytes?: string | number;
}

export interface StorageConsumptionLimit {
  kind: StorageConsumptionLimitKind;
  count: number;
}

export function convertCapacityToBytes(capacity: number, unit: string): number {
  switch (unit) {
    case 'MiB':
    case 'MB':
      return capacity * BYTES_IN_MB;
    case 'GiB':
    case 'GB':
      return capacity * BYTES_IN_GB;
    case 'TiB':
    case 'TB':
      return capacity * BYTES_IN_TB;
    case 'PiB':
    case 'PB':
      return capacity * BYTES_IN_PB;
    default:
      return 0;
  }
}

export function parseCapacityBytes(input: CapacityInput): number {
  if (input.capacityBytes) {
    const parsed =
      typeof input.capacityBytes === 'string'
        ? parseFloat(input.capacityBytes)
        : input.capacityBytes;
    return isNaN(parsed) ? 0 : parsed;
  }

  if (input.capacity && input.capacityUnit) {
    const capacity = parseFloat(input.capacity);
    if (isNaN(capacity)) {
      return 0;
    }
    return convertCapacityToBytes(capacity, input.capacityUnit);
  }

  return 0;
}

export function calculateStorageConsumptionLimit(
  capacityBytes: number,
): StorageConsumptionLimit {
  if (capacityBytes >= BYTES_IN_PB) {
    return {
      kind: 'PB',
      count: Math.ceil(capacityBytes / BYTES_IN_PB),
    };
  }

  if (capacityBytes >= BYTES_IN_TB) {
    return {
      kind: 'TB',
      count: Math.ceil(capacityBytes / BYTES_IN_TB),
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

export function ensureHttpsPrefix(url: string): string {
  if (!url) {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
}
