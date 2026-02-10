import { calculateStorageConsumptionLimit, parseCapacityBytes } from './capacityCalculations';

describe('capacityCalculations', () => {
  it('converts string capacity bytes to integer', () => {
    expect(parseCapacityBytes('1099511627776')).toBe(1099511627776);
  });

  it('converts number capacity bytes to integer', () => {
    expect(parseCapacityBytes(1099511627776)).toBe(1099511627776);
  });

  it('returns 0 for invalid capacity bytes', () => {
    expect(parseCapacityBytes('invalid')).toBe(0);
    expect(parseCapacityBytes('')).toBe(0);
  });

  it('calculates storage limit in PB for large capacities', () => {
    const result = calculateStorageConsumptionLimit(2 * 1024 ** 5);
    expect(result.kind).toBe('PB');
    expect(result.count).toBe(2);
  });

  it('calculates storage limit in TB for medium capacities', () => {
    const result = calculateStorageConsumptionLimit(5 * 1024 ** 4);
    expect(result.kind).toBe('TB');
    expect(result.count).toBe(5);
  });

  it('rounds up fractional storage limits', () => {
    const pbResult = calculateStorageConsumptionLimit(1.5 * 1024 ** 5);
    expect(pbResult.kind).toBe('PB');
    expect(pbResult.count).toBe(2);

    const tbResult = calculateStorageConsumptionLimit(1.2 * 1024 ** 4);
    expect(tbResult.kind).toBe('TB');
    expect(tbResult.count).toBe(2);
  });

  it('sets minimum 1 TB for small positive capacities', () => {
    const result = calculateStorageConsumptionLimit(0.5 * 1024 ** 4);
    expect(result.kind).toBe('TB');
    expect(result.count).toBe(1);
  });

  it('returns 0 TB for zero capacity', () => {
    const result = calculateStorageConsumptionLimit(0);
    expect(result.kind).toBe('TB');
    expect(result.count).toBe(0);
  });
});
