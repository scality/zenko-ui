import {
  BYTES_IN_GB,
  BYTES_IN_MB,
  BYTES_IN_PB,
  BYTES_IN_TB,
  calculateStorageConsumptionLimit,
  convertCapacityToBytes,
  ensureHttpsPrefix,
  parseCapacityBytes,
} from './capacityCalculations';

describe('capacityCalculations', () => {
  describe('convertCapacityToBytes', () => {
    it('should convert MiB to bytes', () => {
      expect(convertCapacityToBytes(100, 'MiB')).toBe(100 * BYTES_IN_MB);
      expect(convertCapacityToBytes(100, 'MB')).toBe(100 * BYTES_IN_MB);
    });

    it('should convert GiB to bytes', () => {
      expect(convertCapacityToBytes(50, 'GiB')).toBe(50 * BYTES_IN_GB);
      expect(convertCapacityToBytes(50, 'GB')).toBe(50 * BYTES_IN_GB);
    });

    it('should convert TiB to bytes', () => {
      expect(convertCapacityToBytes(10, 'TiB')).toBe(10 * BYTES_IN_TB);
      expect(convertCapacityToBytes(10, 'TB')).toBe(10 * BYTES_IN_TB);
    });

    it('should convert PiB to bytes', () => {
      expect(convertCapacityToBytes(2, 'PiB')).toBe(2 * BYTES_IN_PB);
      expect(convertCapacityToBytes(2, 'PB')).toBe(2 * BYTES_IN_PB);
    });

    it('should return 0 for unknown units', () => {
      expect(convertCapacityToBytes(100, 'UNKNOWN')).toBe(0);
    });
  });

  describe('parseCapacityBytes', () => {
    it('should parse capacityBytes as string', () => {
      expect(parseCapacityBytes({ capacityBytes: '1099511627776' })).toBe(
        1099511627776,
      );
    });

    it('should parse capacityBytes as number', () => {
      expect(parseCapacityBytes({ capacityBytes: 1099511627776 })).toBe(
        1099511627776,
      );
    });

    it('should calculate from capacity and capacityUnit', () => {
      expect(parseCapacityBytes({ capacity: '10', capacityUnit: 'TiB' })).toBe(
        10 * BYTES_IN_TB,
      );
    });

    it('should prefer capacityBytes over capacity + capacityUnit', () => {
      expect(
        parseCapacityBytes({
          capacityBytes: 1000,
          capacity: '10',
          capacityUnit: 'TiB',
        }),
      ).toBe(1000);
    });

    it('should return 0 for invalid capacityBytes string', () => {
      expect(parseCapacityBytes({ capacityBytes: 'invalid' })).toBe(0);
    });

    it('should return 0 for invalid capacity', () => {
      expect(
        parseCapacityBytes({ capacity: 'invalid', capacityUnit: 'TiB' }),
      ).toBe(0);
    });

    it('should return 0 when no capacity is provided', () => {
      expect(parseCapacityBytes({})).toBe(0);
    });
  });

  describe('calculateStorageConsumptionLimit', () => {
    it('should calculate PB for capacity >= 1 PB', () => {
      const result = calculateStorageConsumptionLimit(2 * BYTES_IN_PB);
      expect(result.kind).toBe('PB');
      expect(result.count).toBe(2);
    });

    it('should round up PB fractional values', () => {
      const result = calculateStorageConsumptionLimit(1.5 * BYTES_IN_PB);
      expect(result.kind).toBe('PB');
      expect(result.count).toBe(2);
    });

    it('should calculate TB for capacity >= 1 TB', () => {
      const result = calculateStorageConsumptionLimit(5 * BYTES_IN_TB);
      expect(result.kind).toBe('TB');
      expect(result.count).toBe(5);
    });

    it('should round up TB fractional values', () => {
      const result = calculateStorageConsumptionLimit(1.2 * BYTES_IN_TB);
      expect(result.kind).toBe('TB');
      expect(result.count).toBe(2);
    });

    it('should set minimum 1 TB for capacity less than 1 TB but greater than 0', () => {
      const result = calculateStorageConsumptionLimit(0.5 * BYTES_IN_TB);
      expect(result.kind).toBe('TB');
      expect(result.count).toBe(1);
    });

    it('should return 0 TB for capacity of 0', () => {
      const result = calculateStorageConsumptionLimit(0);
      expect(result.kind).toBe('TB');
      expect(result.count).toBe(0);
    });

    it('should handle real-world scenario: 71.97 GiB', () => {
      const capacityBytes = 77277199073;
      const result = calculateStorageConsumptionLimit(capacityBytes);
      expect(result.kind).toBe('TB');
      expect(result.count).toBe(1);
    });
  });

  describe('ensureHttpsPrefix', () => {
    it('should not modify URLs that already have https://', () => {
      expect(ensureHttpsPrefix('https://example.com')).toBe(
        'https://example.com',
      );
    });

    it('should not modify URLs that have http://', () => {
      expect(ensureHttpsPrefix('http://example.com')).toBe(
        'http://example.com',
      );
    });

    it('should add https:// to URLs without protocol', () => {
      expect(ensureHttpsPrefix('example.com')).toBe('https://example.com');
      expect(ensureHttpsPrefix('s3.artesca.local')).toBe(
        'https://s3.artesca.local',
      );
    });

    it('should return empty string for empty input', () => {
      expect(ensureHttpsPrefix('')).toBe('');
    });
  });
});
