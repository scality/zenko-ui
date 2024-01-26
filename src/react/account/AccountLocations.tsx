import { Icon, Loader, Stack } from '@scality/core-ui';
import { Table } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { CellProps, CoreUIColumn } from 'react-table';
import { useListLocationsForCurrentAccount } from '../next-architecture/domain/business/locations';
import { Location } from '../next-architecture/domain/entities/location';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';
import { ColdStorageIcon } from '../ui-elements/ColdStorageIcon';
import { HelpLocationTargetBucket } from '../ui-elements/Help';
import { Search } from '../ui-elements/Table';
import { Warning } from '../ui-elements/Warning';
import { getLocationType } from '../utils/storageOptions';
import { CenterredSecondaryText } from './iamAttachment/AttachmentTable';

export function AccountLocations() {
  const metricsAdapter = useMetricsAdapter();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { locations } = useListLocationsForCurrentAccount({
    metricsAdapter,
    accountsLocationsEndpointsAdapter,
  });

  const data = useMemo(() => {
    if (locations.status === 'success') return Object.values(locations.value);
    else return [];
  }, [locations]);

  const SEARCH_QUERY_PARAM = 'search';
  const columns = useMemo(() => {
    const dataUsedColumn = getDataUsedColumn(
      (location: Location) => {
        return location;
      },
      { flex: '0.2' },
    );
    const columns: CoreUIColumn<Location>[] = [
      {
        Header: 'Location Name',
        accessor: 'name',
        cellStyle: {
          textAlign: 'left',
          minWidth: '20rem',
        },
      },
      {
        Header: 'Location Type',
        accessor: 'type',
        cellStyle: {
          textAlign: 'left',
          minWidth: '24rem',
        },
        Cell(value: CellProps<Location>) {
          const rowValues = value.row.original;
          const locationType = getLocationType(rowValues);
          if (rowValues.isCold) {
            return (
              <Stack>
                <ColdStorageIcon /> {locationType}
              </Stack>
            );
          }
          return locationType;
        },
      },
      {
        Header: (
          <>
            Target Bucket <HelpLocationTargetBucket />
          </>
        ),
        //@ts-expect-error fix this when you are working on it
        accessor: 'details.bucketName',
        cellStyle: {
          textAlign: 'left',
          flex: '0.3',
        },
      },
      dataUsedColumn,
    ];

    return columns;
  }, [locations]);

  if (locations.status === 'loading' || locations.status === 'unknown') {
    return (
      <Stack>
        <Loader size="huge" />
        <div>Loading locations...</div>
      </Stack>
    );
  }
  if (locations.status === 'error') {
    return (
      <Warning
        icon={<Icon name="Times-circle" size="2x" />}
        title="Unable to load locations."
      />
    );
  }

  return (
    <Table columns={columns} data={data} defaultSortingKey={'name'}>
      <Search>
        <Table.SearchWithQueryParams
          displayedName={{
            singular: 'location',
            plural: 'locations',
          }}
          queryParams={SEARCH_QUERY_PARAM}
        />
      </Search>
      <Table.SingleSelectableContent
        id="singleTable"
        rowHeight="h40"
        separationLineVariant="backgroundLevel1"
        backgroundVariant="backgroundLevel3"
        //@ts-expect-error fix this when you are working on it
        customItemKey={(index: number, data: Array<Location>) =>
          data[index].name
        }
        //@ts-expect-error fix this when you are working on it
        key={(index: number, data: Array<Location>) => data[index].name}
      >
        {(Rows) =>
          data.length === 0 ? (
            <CenterredSecondaryText>No Locations</CenterredSecondaryText>
          ) : (
            <>{Rows}</>
          )
        }
      </Table.SingleSelectableContent>
    </Table>
  );
}
