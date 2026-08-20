import { Box } from '@scality/core-ui/dist/next';
import { type Bucket, type ColumnConfig, DataBrowserUI } from '@scality/data-browser-library';
import { useCallback, useMemo } from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router';
import { XDM_FEATURE } from '../../js/config';
import { StartISVConnectorButton } from '../ISV/components/StartISVConnectorButton';
import { useLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { Breadcrumb, breadcrumbPathsBuckets } from '../ui-elements/Breadcrumb';
import { useAuthGroups, useQueryParams } from '../utils/hooks';
import { storageOptions } from '../locations/LocationDetails';
import type { LocationTypeKey } from '../../types/config';
import type { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { BucketLocationsPrefetch } from './BucketLocationsPrefetch';
import { BucketCreateVersioning } from './buckets/BucketCreateVersioning';
import { DataUsedColumn } from './buckets/DataUsedColumn';
import { LocationSection } from './buckets/LocationSection';
import { LocationSelector } from './buckets/LocationSelector';
import { ReplicationCRRDestinationFields } from './buckets/ReplicationCRRDestinationFields';
import { StorageClassSelector } from './buckets/StorageClassSelector';
import { MetadataUpdatesColumn } from './buckets/MetadataUpdatesColumn';
import { StorageLocationColumn } from './buckets/StorageLocationColumn';
import { UseCaseSection } from './buckets/UseCaseSection';
import { useBucketCreateConfig } from './buckets/useBucketCreateConfig';
import ListLayoutButtons from './HeaderButtons';
import { BucketMetricsPrefetch } from './hooks/useBucketMetrics';

// Served by the bundled documentation, so these resolve in offline deployments too.
// Expiration is a chapter with its own index; transition is a single page.
const BUCKET_OPERATIONS_DOCS = '/artesca/docs/data_management/bucket_operations';
const LIFECYCLE_EXPIRATION_DOCS_URL = `${BUCKET_OPERATIONS_DOCS}/lifecycle_expiration/index.html`;
const LIFECYCLE_TRANSITION_DOCS_URL = `${BUCKET_OPERATIONS_DOCS}/transition_workflow.html`;

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

export function getVersioningDisabledStatus(
  locations: LocationInfo[],
  locationConstraint: string,
): { disabled: boolean; tooltip?: string } {
  const location = locations.find((loc) => loc.name === locationConstraint);
  if (!location) return { disabled: false };
  const options = (storageOptions as Partial<Record<string, (typeof storageOptions)[LocationTypeKey]>>)[
    location.type as unknown as string
  ];
  if (options && !options.supportsVersioning) {
    return {
      disabled: true,
      tooltip: `Versioning is not supported on ${options.name}.`,
    };
  }
  return { disabled: false };
}

export default function DataBrowser({ hideHeader = false }: { hideHeader?: boolean }) {
  const { accountName } = useParams<{ accountName: string }>();
  const { isStorageManager } = useAuthGroups();

  const { pathname } = useLocation();
  const query = useQueryParams();
  const prefixPath = query.get('prefix');

  const { basePath, features } = useConfig();

  const dataBrowserBasePath = `${basePath}/accounts/${accountName}`;

  const { bucketCreateExtraFields, transformBucketCreateData } = useBucketCreateConfig();

  const adapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints } = useLocationsAndEndpoints({
    locationsEndpointsAdapter: adapter,
  });
  const locations = useMemo(
    () => locationsAndEndpoints?.locations ?? [],
    [locationsAndEndpoints?.locations],
  );

  const isLocationCold = useCallback(
    (locationName: string) => locations.some((loc) => loc.name === locationName && loc.isCold),
    [locations],
  );

  const isVersioningDisabled = useCallback(
    (locationConstraint: string) => getVersioningDisabledStatus(locations, locationConstraint),
    [locations],
  );

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

    if (features.includes(XDM_FEATURE)) {
      columns.push({
        id: 'ingestion',
        header: 'Metadata updates',
        render: MetadataUpdatesColumn,
        width: '180px',
        cellStyle: { textAlign: 'right' },
      });
    }

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
  }, [isStorageManager, features]);

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
        isLocationCold={isLocationCold}
        isVersioningDisabled={isVersioningDisabled}
        lifecycleExpirationDocsUrl={LIFECYCLE_EXPIRATION_DOCS_URL}
        lifecycleTransitionDocsUrl={LIFECYCLE_TRANSITION_DOCS_URL}
      />
    </>
  );
}
