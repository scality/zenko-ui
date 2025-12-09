import AWS from 'aws-sdk/lib/core';
import OriginalV4Signer from 'aws-sdk/lib/signers/v4';

let signerInitialized = false;

export const initializeAWSSigner = ({
  iamInternalFQDN,
  s3InternalFQDN,
  zenkoEndpoint,
  iamEndpoint,
}: {
  iamInternalFQDN: string;
  s3InternalFQDN: string;
  zenkoEndpoint: string;
  iamEndpoint: string;
}) => {
  if (signerInitialized) return;

  //@ts-expect-error - Signers is not typed
  AWS.Signers.V4 = function V4(request, serviceName, options) {
    const originalRequest = JSON.parse(JSON.stringify(request));

    if (request.path.startsWith(zenkoEndpoint)) {
      request.path = request.path.replace(zenkoEndpoint, '');
      request.endpoint.path = request.path.replace(zenkoEndpoint, '');
      request.endpoint.pathname = request.path.replace(zenkoEndpoint, '');
      request.endpoint.port = 80;

      request.headers.Host = s3InternalFQDN;

      request.endpoint.host = s3InternalFQDN;
      request.endpoint.hostname = s3InternalFQDN;
      request.endpoint.href = `https://${s3InternalFQDN}`;
    } else if (request.path.startsWith(iamEndpoint)) {
      request.path = request.path.replace(iamEndpoint, '/');
      request.endpoint.path = request.path.replace(iamEndpoint, '/');
      request.endpoint.pathname = request.path.replace(iamEndpoint, '/');
      request.endpoint.port = 80;

      request.headers.Host = iamInternalFQDN;

      request.endpoint.host = iamInternalFQDN;
      request.endpoint.hostname = iamInternalFQDN;
      request.endpoint.href = `https://${iamInternalFQDN}`;
    }

    const originalV4Signer = new OriginalV4Signer(
      request,
      serviceName,
      options,
    );
    originalV4Signer.originalAddAuthorization =
      originalV4Signer.addAuthorization;
    originalV4Signer.addAuthorization = function addAuthorization(
      credentials: AWS.Credentials,
      date: Date,
    ) {
      const result = this.originalAddAuthorization(credentials, date);

      if (!this.isPresigned()) {
        request.endpoint = originalRequest.endpoint;
        request.headers = {
          ...originalRequest.headers,
          ...request.headers,
          Host: originalRequest.headers.Host,
        };
        request.path = originalRequest.path;
      } else {
        request.endpoint = originalRequest.endpoint;
        request.headers = {
          ...originalRequest.headers,
          ...request.headers,
          Host: originalRequest.headers.Host,
        };
        request.path = zenkoEndpoint + request.path;
      }
      return result;
    };

    return originalV4Signer;
  };

  signerInitialized = true;
};

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

export const genClientEndpoint = (endpoint: string) => {
  const fullURLEndpoint = endpoint.startsWith('http')
    ? endpoint
    : window.location.origin + endpoint;

  return fullURLEndpoint;
};
