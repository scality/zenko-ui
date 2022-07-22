import { DateTime } from 'luxon';
export const systemMetadata = [
  {
    key: 'CacheControl',
    header: 'cache-control',
  },
  {
    key: 'ContentDisposition',
    header: 'content-disposition',
  },
  {
    key: 'ContentEncoding',
    header: 'content-encoding',
  },
  {
    key: 'ContentType',
    header: 'content-type',
  },
  {
    key: 'WebsiteRedirectLocation',
    header: 'website-redirect-location',
  },
];
export const systemMetadataKeys = systemMetadata.map((m) => m.key);
export const AMZ_META = 'x-amz-meta';
export const METADATA_USER_TYPE = 'user';
export const METADATA_SYSTEM_TYPE = 'system';
export function errorParser(error) {
  let message = '';

  if (error.response && error.response.body && error.response.body.message) {
    message = error.response.body.message;
  } else if (error.status === 401) {
    message = 'The request is missing valid authentication credentials.';
  } else if (error.status === 403) {
    message = 'Access to the requested item was denied.';
  } else if (error.status === 404) {
    message = 'The requested item does not exist.';
  } else if (error.status === 409) {
    message = 'An item with the same identifier already exists.';
  } else if (error.status === 500 || error.status === 503) {
    message = 'The server is temporarily unavailable.';
  } else if (error.message) {
    message = error.message;
  } else {
    message = `Failed with error status: ${String(error.status)}`;
  }

  return {
    message,
  };
}
export function formatDate(d) {
  return `${d.toDateString()} ${d.toTimeString().split(' ')[0]}`;
}
export function formatShortDate(d: Date) {
  const date = DateTime.fromISO(d?.toISOString()).toISODate();
  const time = DateTime.fromISO(d?.toISOString()).toFormat('TT');
  return `${date} ${time}`;
}
export function formatSimpleDate(d) {
  return d.toISOString().split('T')[0];
}
export const stripTrailingSlash = (name) =>
  name.slice(-1) === '/' ? name.slice(0, -1) : name;
export const addTrailingSlash = (name) =>
  name ? (name.slice(-1) !== '/' ? `${name}/` : name) : '';
export const maybePluralize = (
  count,
  noun,
  suffix = 's',
  displayCount = true,
) =>
  displayCount
    ? `${count} ${noun}${count > 1 ? suffix : ''}`
    : `${noun}${count > 1 ? suffix : ''}`;
export function stripQuotes(s) {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }

  return s;
}
export const isEmptyItem = (item) => item.key === '' && item.value === '';
export const isVersioning = (type) => type === 'Enabled';
export const isVersioningDisabled = (type) => type === 'Disabled';
