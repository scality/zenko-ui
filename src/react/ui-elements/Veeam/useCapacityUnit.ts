import prettyBytes from 'pretty-bytes';
import { unitChoices } from './VeeamConstants';

type Units = 'GiB' | 'TiB' | 'PiB';

export const useCapacityUnit = (
  capacity: string,
  isEightyPercentCapacity = false,
): {
  capacityValue: string;
  capacityUnit: string;
} => {
  const pBytesCapacity = prettyBytes(
    isEightyPercentCapacity
      ? 0.8 * parseInt(capacity, 10)
      : parseInt(capacity, 10),
    {
      locale: 'en',
      binary: true,
      maximumFractionDigits: 0,
    },
  );
  const capacityValue = pBytesCapacity.split(' ')[0];
  const capacityUnit = `${unitChoices[pBytesCapacity.split(' ')[1] as Units]}`;
  return { capacityValue, capacityUnit };
};

export const getCapacityBytes = (
  capacityValue: string,
  capacityUnit: string,
) => {
  return (parseFloat(capacityValue) * parseInt(capacityUnit, 10)).toString();
};
