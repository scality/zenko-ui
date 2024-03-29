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
    maximumFractionDigits: 0,
  });
  const capacityValue = pBytesCapacity.split(' ')[0];
  const capacityUnit = `${unitChoices[pBytesCapacity.split(' ')[1] as Units]}`;
  return { capacityValue, capacityUnit };
};

export const getCapacityBytes = (
  capacityValue: string,
  capacityUnit: string,
) => {
  return (parseInt(capacityValue, 10) * parseInt(capacityUnit, 10)).toString();
};
