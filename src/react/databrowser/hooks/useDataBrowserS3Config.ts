/**
 * Hook for creating S3 configuration for DataBrowserProvider
 *
 * This hook provides the S3 configuration needed by DataBrowserProvider,
 * including credentials, endpoint, and development proxy settings.
 */

import { useMemo } from 'react';
import { useAssumedRole } from '../../DataServiceRoleProvider';
import { DEFAULT_REGION } from '../../ISV/components/ISVSummary';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { genClientEndpoint } from '../../utils';

export const useDataBrowserS3Config = () => {
  const assumedRole = useAssumedRole();
  const { zenkoEndpoint, features, s3InternalFQDN } = useConfig();

  const {
    AccessKeyId: accessKeyId,
    SecretAccessKey: secretAccessKey,
    SessionToken: sessionToken,
  } = assumedRole?.Credentials || {};
  const region = DEFAULT_REGION;

  const getS3Config = useMemo(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const endpoint = genClientEndpoint(zenkoEndpoint);

    return () => ({
      endpoint,
      region,
      forcePathStyle: true,
      features,
      ...(isDevelopment && {
        useDevProxy: true,
        realS3Host: s3InternalFQDN,
        proxyPath: zenkoEndpoint,
      }),
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    });
  }, [zenkoEndpoint, region, features, s3InternalFQDN, accessKeyId, secretAccessKey, sessionToken]);

  return {
    getS3Config,
    accessKeyId,
    secretAccessKey,
    sessionToken,
  };
};
