import prettyBytes from 'pretty-bytes';
import { unitChoices } from './VeeamConstants';

type Units = 'GiB' | 'TiB' | 'PiB';

export const useCapacityUnit = (capacity: string, pBytes = false) => {
  const pBytesCapacity = pBytes
    ? prettyBytes(parseInt(capacity, 10), {
        locale: 'en',
        binary: true,
      })
    : capacity;
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
