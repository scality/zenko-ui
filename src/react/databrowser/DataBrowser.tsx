import { useMemo } from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router';
import { useTheme } from 'styled-components';
import { Breadcrumb, breadcrumbPathsBuckets } from '../ui-elements/Breadcrumb';
import ListLayoutButtons from './HeaderButtons';
import { useAuthGroups, useQueryParams } from '../utils/hooks';
import { Box } from '@scality/core-ui/dist/next';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import {
  Bucket,
  ColumnConfig,
  DataBrowserProvider,
  DataBrowserUI,
} from '@scality/data-browser-library';
import { StorageLocationColumn } from './buckets/StorageLocationColumn';
import { DataUsedColumn } from './buckets/DataUsedColumn';
import { UseCaseSection } from './buckets/UseCaseSection';
import { LocationSection } from './buckets/LocationSection';
import { StartISVConnectorButton } from '../ISV/components/StartISVConnectorButton';
import { useDataBrowserS3Config } from './hooks/useDataBrowserS3Config';
import { BucketMetricsPrefetch } from './hooks/useBucketMetrics';
import { BucketLocationsPrefetch } from './BucketLocationsPrefetch';

const EXTRA_BUCKET_OVERVIEW_SECTIONS = [
  {
    id: 'useCase',
    title: 'Use-case',
    render: UseCaseSection,
  },
];

const EXTRA_BUCKET_OVERVIEW_GENERAL = [
  {
    id: 'location',
    render: LocationSection,
  },
];

export default function DataBrowser({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const { accountName } = useParams<{ accountName: string }>();
  const { isStorageManager } = useAuthGroups();
  const theme = useTheme();

  const { pathname } = useLocation();
  const query = useQueryParams();
  const prefixPath = query.get('prefix');

  const { basePath } = useConfig();
  const { getS3Config } = useDataBrowserS3Config();

  const dataBrowserBasePath = `${basePath}/accounts/${accountName}`;

  const extraBucketListColumns = useMemo(() => {
    const columns: ColumnConfig<Bucket>[] = [
      {
        id: 'location',
        header: 'Storage Location',
        render: StorageLocationColumn,
        width: '280px',
        cellStyle: { textAlign: 'left' },
      },
    ];

    if (isStorageManager) {
      columns.push({
        id: 'dataUsed',
        header: 'Data Used',
        render: DataUsedColumn,
        width: '150px',
        cellStyle: { textAlign: 'right' },
      });
    }

    return columns;
  }, [isStorageManager]);

  const extraBucketListActions = [
    {
      id: 'startISVConnector',
      render: () => <StartISVConnectorButton />,
    },
  ];

  const headerComponent = useMemo(
    () => (
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Breadcrumb
          breadcrumbPaths={breadcrumbPathsBuckets(
            pathname,
            prefixPath,
            accountName,
            basePath,
          )}
        />
        <Routes>
          <Route path={':bucketName'} element={<ListLayoutButtons />} />
        </Routes>
      </Box>
    ),
    [pathname, prefixPath, accountName, basePath],
  );

  // TODO: Move DataBrowserProvider to the S3ClientProvider when refactoring the S3ClientProvider
  return (
    <DataBrowserProvider getS3Config={getS3Config} theme={theme}>
      <BucketMetricsPrefetch />
      <BucketLocationsPrefetch />
      <DataBrowserUI
        basePath={dataBrowserBasePath}
        header={hideHeader ? undefined : headerComponent}
        extraBucketListColumns={extraBucketListColumns}
        extraBucketOverviewSections={EXTRA_BUCKET_OVERVIEW_SECTIONS}
        extraBucketOverviewGeneral={EXTRA_BUCKET_OVERVIEW_GENERAL}
        extraBucketListActions={extraBucketListActions}
      />
    </DataBrowserProvider>
  );
}
