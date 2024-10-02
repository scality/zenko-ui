import prettyBytes from 'pretty-bytes';
import { unitChoices } from './VeeamConstants';

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
  const capacityUnit = `${unitChoices[pBytesCapacity.split(' ')[1] as Units]}`;
  return { capacityValue, capacityUnit };
};

export const getCapacityBytes = (
  capacityValue: string,
  capacityUnit: string,
) => {
  return Math.round(
    parseFloat(capacityValue) * parseFloat(capacityUnit),
  ).toString();
};
