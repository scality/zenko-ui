export interface S3ClientCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface DataBrowserS3Config {
  endpoint: string;
  region: string;
  forcePathStyle: boolean;
  useDevProxy?: boolean;
  realS3Host?: string;
  proxyPath?: string;
  credentials: S3ClientCredentials;
}

export interface CreateS3ConfigOptions {
  zenkoEndpoint: string;
  credentials: S3ClientCredentials;
  region?: string;
}

/**
 * Creates S3 configuration for DataBrowserProvider
 *
 * Handles development proxy setup automatically:
 * - Development: Uses localhost origin with proxyPath for middleware
 * - Production: Uses full zenkoEndpoint
 */
//TODO: hostname should be configurable
export function createDataBrowserS3Config({
  zenkoEndpoint,
  credentials,
  region = 'us-east-1',
}: CreateS3ConfigOptions): DataBrowserS3Config {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const endpoint = isDevelopment
    ? window.location.origin
    : zenkoEndpoint.startsWith('http')
    ? zenkoEndpoint
    : `${window.location.origin}${zenkoEndpoint}`;

  return {
    endpoint,
    region,
    forcePathStyle: true,
    ...(isDevelopment && {
      useDevProxy: true,
      realS3Host: 's3.pod-choco.local',
      proxyPath: zenkoEndpoint,
    }),
    credentials,
  };
}
