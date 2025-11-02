import { ComponentType, ReactNode, useMemo } from 'react';
import { DataBrowserProvider } from '@scality/data-browser-library';
import { useTheme } from 'styled-components';
import { CoreUITheme } from '@scality/core-ui/dist/style/theme';
import { S3ConfigProvider } from '../next-architecture/adapters/s3/DataBrowserHookFactory';
import { S3OperationConfig } from '../next-architecture/domain/interfaces/IS3Operations';
import { DataBrowserS3Config } from '../next-architecture/adapters/s3/createDataBrowserS3Config';

interface DataBrowserIsolatedWrapperProps {
  config?: S3OperationConfig;
  children: ReactNode;
  s3Config: DataBrowserS3Config;
}

interface DataBrowserProviderCompatProps {
  getS3Config: () => DataBrowserS3Config;
  theme: CoreUITheme;
  children: ReactNode;
}

/**
 * Isolated DataBrowser Wrapper
 *
 * Wraps data-browser-library with React Query v5 isolation and optional S3 operation config.
 *
 * Key features:
 * - Isolates React Query v5 (library) from v3 (zenko-ui)
 * - Provides default S3 operation config via context
 *
 * Usage:
 * ```tsx
 * const s3Config = createDataBrowserS3Config({
 *   zenkoEndpoint,
 *   credentials: assumedRole.Credentials,
 *   region: 'us-east-1'
 * });
 *
 * <DataBrowserIsolatedWrapper config={isvConfig} s3Config={s3Config}>
 *   <YourComponent />
 * </DataBrowserIsolatedWrapper>
 * ```
 */
export const DataBrowserIsolatedWrapper = ({
  config = {},
  children,
  s3Config,
}: DataBrowserIsolatedWrapperProps) => {
  const theme = useTheme();
  const getS3Config = useMemo(() => () => s3Config, [s3Config]);
  const DataBrowserProviderCompat =
    DataBrowserProvider as ComponentType<DataBrowserProviderCompatProps>;

  return (
    <DataBrowserProviderCompat getS3Config={getS3Config} theme={theme}>
      <S3ConfigProvider value={config}>{children}</S3ConfigProvider>
    </DataBrowserProviderCompat>
  );
};
