import { useCapacityUnit, getCapacityBytes } from './useCapacityUnit';
import { renderHook } from '@testing-library/react-hooks';

const BYTES_IN_GIB = '1073741824';
const BYTES_IN_TIB = '1099511627776';
const BYTES_IN_PIB = '1125899906842624';

describe('useCapacityUnit', () => {
  it('should correctly convert bytes to GiB unit', () => {
    // 1 GiB = 1,073,741,824 bytes
    const { result } = renderHook(() => useCapacityUnit(1073741824));
    
    expect(result.current.capacityValue).toBe('1');
    expect(result.current.capacityUnit).toBe(BYTES_IN_GIB);
  });

  it('should correctly convert bytes to TiB unit', () => {
    // 1 TiB = 1,099,511,627,776 bytes
    const { result } = renderHook(() => useCapacityUnit(1099511627776));
    
    expect(result.current.capacityValue).toBe('1');
    expect(result.current.capacityUnit).toBe(BYTES_IN_TIB);
  });

  it('should correctly convert bytes to PiB unit', () => {
    // 1 PiB = 1,125,899,906,842,624 bytes
    const { result } = renderHook(() => useCapacityUnit(1125899906842624));
    
    expect(result.current.capacityValue).toBe('1');
    expect(result.current.capacityUnit).toBe(BYTES_IN_PIB);
  });

  it('should correctly handle small values', () => {
    // 1.5 GiB = 1,610,612,736 bytes
    const { result } = renderHook(() => useCapacityUnit(1610612736));
    
    expect(result.current.capacityValue).toBe('1.5');
    expect(result.current.capacityUnit).toBe(BYTES_IN_GIB);
  });
});

describe('getCapacityBytes', () => {
  it('should correctly convert GiB to bytes', () => {
    const result = getCapacityBytes('1', BYTES_IN_GIB);
    expect(result).toBe(BYTES_IN_GIB);
  });

  it('should correctly convert TiB to bytes', () => {
    const result = getCapacityBytes('1', BYTES_IN_TIB);
    expect(result).toBe(BYTES_IN_TIB);
  });

  it('should correctly convert PiB to bytes', () => {
    const result = getCapacityBytes('1', BYTES_IN_PIB);
    expect(result).toBe(BYTES_IN_PIB);
  });

  it('should correctly convert small values to bytes', () => {
    const result = getCapacityBytes('1.5', BYTES_IN_GIB);
    expect(result).toBe('1610612736');
  });

  it('should handle decimal inputs correctly', () => {
    const result = getCapacityBytes('2.25', BYTES_IN_TIB);
    expect(result).toBe('2473901162496');
  });

  it('should return "0" when inputs are invalid', () => {
    expect(getCapacityBytes('invalid', BYTES_IN_GIB)).toBe('0');
    expect(getCapacityBytes('1', 'invalid')).toBe('0');
    expect(getCapacityBytes('', '')).toBe('0');
  });
}); 