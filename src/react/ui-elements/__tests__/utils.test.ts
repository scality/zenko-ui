import { getUniqueErrorMessages, paginateData } from '../EmptyBucket/utils';

const MAX_KEYS = 10;

describe('paginateData', () => {
  it('should return the sliced array based on MAX_KEYS', () => {
    const data = Array.from({ length: 20 }, () => ({
      Key: '123',
      VersionId: '123',
    }));
    const result = paginateData(data, MAX_KEYS);
    expect(result.length).toEqual(MAX_KEYS);
  });

  it('should return the entire array when data length is less than  MAX_KEYS', () => {
    const data = Array.from({ length: 2 }, () => ({
      Key: '123',
      VersionId: '123',
    }));
    const result = paginateData(data);
    expect(result.length).toEqual(2);
  });
});

describe('getUniqueErrorMessages', () => {
  it('should return a unique error message with error number 1 if input has one message', () => {
    const errorMessages = ['Error 1'];
    const result = getUniqueErrorMessages(errorMessages);
    expect(result).toEqual([{ message: 'Error 1', errorNumbers: 1 }]);
  });

  it('should return unique error messages with correct error numbers if input has multiple messages', () => {
    const errorMessages = [
      'Error 1',
      'Error 2',
      'Error 1',
      'Error 3',
      'Error 2',
    ];
    const result = getUniqueErrorMessages(errorMessages);
    expect(result).toEqual([
      { message: 'Error 1', errorNumbers: 2 },
      { message: 'Error 2', errorNumbers: 2 },
      { message: 'Error 3', errorNumbers: 1 },
    ]);
  });

  it('should increment errorNumbers if the same error message occurs multiple times', () => {
    const errorMessages = ['Error 1', 'Error 1', 'Error 1'];
    const result = getUniqueErrorMessages(errorMessages);
    expect(result).toEqual([{ message: 'Error 1', errorNumbers: 3 }]);
  });
});
