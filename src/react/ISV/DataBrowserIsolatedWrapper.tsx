import { ComponentType, ReactNode, useMemo } from 'react';
import { DataBrowserProvider } from '@scality/data-browser-library';
import { useTheme } from 'styled-components';
import { CoreUITheme } from '@scality/core-ui/dist/style/theme';
import { DataBrowserHookFactory } from '../next-architecture/adapters/s3/DataBrowserHookFactory';
import { S3HookFactoryProvider } from '../next-architecture/ui/S3HookFactoryProvider';
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
 * This component completely relies on data-browser-library's internal React Query v5,
 * without using zenko-ui's React Query v3, thus avoiding version conflicts.
 * 
 * Key features:
 * - Uses data-browser-library's React Query v5 internally
 * - Provides S3 hook factory with config hierarchy support
 * - Completely isolated from zenko-ui's React Query v3 context
 * - Avoids QueryClient conflicts between different React Query versions
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

  const getS3Config = useMemo(() => {
    return () => s3Config;
  }, [s3Config]);

  const hookFactory = useMemo(() => {
    return new DataBrowserHookFactory(config);
  }, [config]);

  const DataBrowserProviderCompat = DataBrowserProvider as ComponentType<DataBrowserProviderCompatProps>;

  return (
    <DataBrowserProviderCompat getS3Config={getS3Config} theme={theme}>
      <S3HookFactoryProvider factory={hookFactory}>
        {children}
      </S3HookFactoryProvider>
    </DataBrowserProviderCompat>
  );
};
