import prettyBytes from 'pretty-bytes';
import { unitChoices } from '../constants';

type Units = 'GiB' | 'TiB' | 'PiB';

export const useCapacityUnit = (
  capacity: number,
): {
  capacityValue: string;
  capacityUnit: string;
} => {
  const pBytesCapacity = prettyBytes(capacity, {
    locale: 'en',
    binary: true,
    maximumFractionDigits: 2,
  });
  const capacityValue = pBytesCapacity.split(' ')[0].replace(',', '');
  const capacityUnit = pBytesCapacity.split(' ')[1] as Units;
  return { capacityValue, capacityUnit };
};

export const getCapacityBytes = (
  capacityValue: string,
  capacityUnit: string,
) => {
  // If capacityUnit is a unit string like 'GiB', 'TiB', 'PiB', convert it to bytes
  const unitMultiplier = unitChoices[capacityUnit as Units] || parseFloat(capacityUnit);
  return Math.round(
    parseFloat(capacityValue) * unitMultiplier,
  ).toString();
};
