import { S3 } from 'aws-sdk';
import { ErrorsList } from './types';

const MAX_KEYS = 1000;

export const paginateData = (
  data: S3.ObjectIdentifierList,
  maxKeys = MAX_KEYS,
) => {
  const index = Math.ceil(data.length / maxKeys);
  const page = (index - 1) * maxKeys;
  const arr = data.slice(page);

  return arr;
};

export const createDeleteObjectsData = (
  deleteMarkers?: S3.DeleteMarkers,
  versions?: S3.ObjectVersionList,
): S3.ObjectIdentifierList => [
  ...(deleteMarkers || []).map((d) => ({
    Key: d.Key || '',
    VersionId: d.VersionId,
  })),
  ...(versions || []).map((v) => ({
    Key: v.Key || '',
    VersionId: v.VersionId,
  })),
];

export const getUniqueErrorMessages = (
  errorMessages: string[],
): ErrorsList[] => {
  const uniqueArray = errorMessages.reduce<ErrorsList[]>((acc, message) => {
    const existingItem = acc.find((item) => item.message === message);
    if (existingItem) {
      existingItem.errorNumbers++;
    } else {
      acc.push({ message, errorNumbers: 1 });
    }
    return acc;
  }, []);

  return uniqueArray;
};
