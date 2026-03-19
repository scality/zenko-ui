import { Box } from '@scality/core-ui/dist/next';
import { type Bucket, type ColumnConfig, DataBrowserUI } from '@scality/data-browser-library';
import { useMemo } from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router';
import { StartISVConnectorButton } from '../ISV/components/StartISVConnectorButton';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { Breadcrumb, breadcrumbPathsBuckets } from '../ui-elements/Breadcrumb';
import { useAuthGroups, useQueryParams } from '../utils/hooks';
import { BucketLocationsPrefetch } from './BucketLocationsPrefetch';
import { BucketCreateVersioning } from './buckets/BucketCreateVersioning';
import { DataUsedColumn } from './buckets/DataUsedColumn';
import { LocationSection } from './buckets/LocationSection';
import { LocationSelector } from './buckets/LocationSelector';
import { ReplicationCRRDestinationFields } from './buckets/ReplicationCRRDestinationFields';
import { StorageClassSelector } from './buckets/StorageClassSelector';
import { StorageLocationColumn } from './buckets/StorageLocationColumn';
import { UseCaseSection } from './buckets/UseCaseSection';
import { useBucketCreateConfig } from './buckets/useBucketCreateConfig';
import ListLayoutButtons from './HeaderButtons';
import { BucketMetricsPrefetch } from './hooks/useBucketMetrics';

const EXTRA_BUCKET_OVERVIEW_SECTIONS = [
  {
    id: 'useCase',
    title: 'Use case',
    render: UseCaseSection,
  },
];

const EXTRA_BUCKET_OVERVIEW_GENERAL = [
  {
    id: 'location',
    label: 'Location',
    render: LocationSection,
  },
];

export default function DataBrowser({ hideHeader = false }: { hideHeader?: boolean }) {
  const { accountName } = useParams<{ accountName: string }>();
  const { isStorageManager } = useAuthGroups();

  const { pathname } = useLocation();
  const query = useQueryParams();
  const prefixPath = query.get('prefix');

  const { basePath } = useConfig();

  const dataBrowserBasePath = `${basePath}/accounts/${accountName}`;

  const { bucketCreateExtraFields, transformBucketCreateData } = useBucketCreateConfig();

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
        <Breadcrumb breadcrumbPaths={breadcrumbPathsBuckets(pathname, prefixPath, accountName, basePath)} />
        <Routes>
          <Route path={':bucketName'} element={<ListLayoutButtons />} />
        </Routes>
      </Box>
    ),
    [pathname, prefixPath, accountName, basePath],
  );

  return (
    <>
      <BucketMetricsPrefetch />
      <BucketLocationsPrefetch />
      <DataBrowserUI
        basePath={dataBrowserBasePath}
        header={hideHeader ? undefined : headerComponent}
        extraBucketListColumns={extraBucketListColumns}
        extraBucketOverviewSections={EXTRA_BUCKET_OVERVIEW_SECTIONS}
        extraBucketOverviewGeneral={EXTRA_BUCKET_OVERVIEW_GENERAL}
        extraBucketListActions={extraBucketListActions}
        storageClassSelector={StorageClassSelector}
        storageClassLabel="Location Name"
        locationSelector={LocationSelector}
        bucketCreateExtraFields={bucketCreateExtraFields}
        transformBucketCreateData={transformBucketCreateData}
        bucketCreateVersioning={BucketCreateVersioning}
        replicationRoleDefault="arn:aws:iam::root:role/s3-replication-role"
        replicationDestinationFields={ReplicationCRRDestinationFields}
      />
    </>
  );
}
