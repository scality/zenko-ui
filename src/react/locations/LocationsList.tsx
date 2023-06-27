import { Replication } from '../../types/config';
import { useCallback, useMemo, useState, ComponentType } from 'react';
import { HelpLocationTargetBucket } from '../ui-elements/Help';
import { canDeleteLocation, canEditLocation } from './utils';
import { deleteLocation } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';

import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { Warning } from '../ui-elements/Warning';
import { push } from 'connected-react-router';
import { Table, Button, Box } from '@scality/core-ui/dist/next';
import { useHistory } from 'react-router-dom';
import { CellProps, CoreUIColumn } from 'react-table';
import { useWorkflows } from '../workflow/Workflows';
import { InlineButton, Search, SearchContainer } from '../ui-elements/Table';
import { ColdStorageIcon } from '../ui-elements/ColdStorageIcon';
import { getLocationType } from '../utils/storageOptions';
import { BucketWorkflowTransitionV2 } from '../../js/managementClient/api';
import { Icon, IconHelp, Stack, Wrap } from '@scality/core-ui';
import { PauseAndResume } from './PauseAndResume';
import {
  queries,
  useListLocations,
} from '../next-architecture/domain/business/locations';
import { useLocationAdapter } from '../next-architecture/ui/LocationAdapterProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { Location } from '../next-architecture/domain/entities/location';
import { useListAccounts } from '../next-architecture/domain/business/accounts';
import { useAccessibleAccountsAdapter } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { useMutation, useQueryClient } from 'react-query';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';

const ActionButtons = ({
  rowValues,
  replications,
  transitions,
}: {
  rowValues: Location;
  replications: Replication[];
  transitions: BucketWorkflowTransitionV2[];
}) => {
  const { name: locationName } = rowValues;
  const dispatch = useDispatch();
  const history = useHistory();
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const buckets = useSelector((state: AppState) => state.stats.bucketList);
  const endpoints = useSelector(
    (state: AppState) => state.configuration.latest.endpoints,
  );
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const locationsAdapter = useLocationAdapter();

  const deleteMutation = useMutation({
    mutationFn: (locationName: string) =>
      dispatch(deleteLocation(locationName)),
    onSuccess: () => {
      queryClient.refetchQueries(
        queries.listLocations(locationsAdapter).queryKey,
      );
    },
  });
  const handleDeleteClick = useCallback(
    (locationName) => deleteMutation.mutate(locationName),
    [dispatch],
  );

  const isDeletionEnable = canDeleteLocation(
    locationName,
    locations,
    replications,
    transitions,
    buckets,
    endpoints,
  );

  return (
    <div>
      <DeleteConfirmation
        show={showModal}
        cancel={() => setShowModal(false)}
        approve={() => handleDeleteClick(locationName)}
        titleText={`Delete location? \n
                    Permanently remove the following location ${locationName} ?`}
      />
      <Wrap>
        <div></div>
        <Stack gap={'r8'}>
          <InlineButton
            icon={<Icon name="Edit" />}
            variant="secondary"
            onClick={() => history.push(`/locations/${locationName}/edit`)}
            type="button"
            aria-label="Edit Location"
            tooltip={{
              overlay: 'Edit Location',
              placement: 'top',
            }}
            disabled={!canEditLocation(locationName, locations)}
          />
          <InlineButton
            icon={<Icon name="Delete" />}
            variant="danger"
            onClick={() => setShowModal(true)}
            type="button"
            tooltip={{
              overlay: isDeletionEnable
                ? 'Delete Location'
                : `You can't delete this location`,
              overlayStyle: { width: '8rem' },
            }}
            disabled={!isDeletionEnable}
          />
        </Stack>
      </Wrap>
    </div>
  );
};

export function LocationsList() {
  const dispatch = useDispatch();
  const history = useHistory();
  const workflowsQuery = useWorkflows();
  const locationsAdapter = useLocationAdapter();
  const metricsAdapter = useMetricsAdapter();
  const { locations } = useListLocations({ locationsAdapter, metricsAdapter });

  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();

  const { accounts } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  const buckets = useSelector((state: AppState) => state.stats.bucketList);
  const endpoints = useSelector(
    (state: AppState) => state.configuration.latest.endpoints,
  );

  const data = useMemo(() => {
    if (locations.status === 'success') return Object.values(locations.value);
    else return [];
  }, [locations]);
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const SEARCH_QUERY_PARAM = 'search';
  const columns = useMemo(() => {
    const dataUsedColumn = getDataUsedColumn(
      (location: Location) => {
        return location;
      },
      { flex: '0.2', marginRight: '1rem' },
    );

    const columns: CoreUIColumn<Location>[] = [
      {
        Header: 'Location Name',
        accessor: 'name',
        cellStyle: {
          textAlign: 'left',
          minWidth: '20rem',
          paddingLeft: '18px',
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
        accessor: 'details.bucketName',
        cellStyle: {
          textAlign: 'left',
          flex: '0.3',
        },
      },
      dataUsedColumn,
    ];

    columns.push({
      Header: (
        <>
          Workflow status{' '}
          <IconHelp
            placement="top"
            overlayStyle={{ width: '24rem' }}
            tooltipMessage={
              <>
                Pausing the Workflow statuses will halt any workflow processes,
                including asynchronous metadata updates and replication, that
                are targeting this location.
                <br /> <br />
                Any new object added to the source location will be queued and
                processed only once the Workflow processes are resumed.
              </>
            }
          />
        </>
      ),
      accessor: 'id',
      disableSortBy: true,
      cellStyle: {
        textAlign: 'left',
        flex: '0.3',
      },
      Cell: ({ row: { original } }) => (
        <PauseAndResume locationName={original.name} />
      ),
    });

    columns.push({
      Header: '',
      accessor: 'details',
      cellStyle: {
        textAlign: 'right',
        minWidth: '10rem',
        marginLeft: 'auto',
        flex: '0.1',
        paddingRight: '18px',
      },
      disableSortBy: true,
      Cell: (value: CellProps<Location>) => {
        if (accounts.status === 'loading' || accounts.status === 'unknown') {
          return <>Checking if linked to workflows...</>;
        }

        if (
          (workflowsQuery.status === 'idle' ||
            workflowsQuery.status === 'loading') &&
          accounts.status === 'success' &&
          accounts.value.length > 0
        ) {
          return <>Checking if linked to workflows...</>;
        }
        return (
          <ActionButtons
            rowValues={value.row.original}
            replications={workflowsQuery.data?.replications || []}
            transitions={workflowsQuery.data?.transitions || []}
          />
        );
      },
    });
    return columns;
  }, [
    dispatch,
    locations,
    buckets,
    endpoints,
    workflowsQuery.data?.replications,
    loading,
  ]);
  if (data.length === 0) {
    return (
      <Warning
        icon={<Icon name="Map-marker" size="5x" />}
        title="Create your first storage location."
        btnTitle="Create Location"
        btnAction={() => dispatch(push('/create-location'))}
      />
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      flex="1"
      style={{ paddingTop: '1rem' }}
      id="endpoint-list"
    >
      <Table columns={columns} data={data} defaultSortingKey={'name'}>
        <SearchContainer>
          <Search>
            <Table.SearchWithQueryParams
              displayedName={{
                singular: 'location',
                plural: 'locations',
              }}
              queryParams={SEARCH_QUERY_PARAM}
            />
          </Search>
          <Button
            icon={<Icon name="Create-add" />}
            label="Create Location"
            variant="primary"
            onClick={() => history.push('/create-location')}
            type="submit"
          />
        </SearchContainer>
        <Table.SingleSelectableContent
          id="singleTable"
          rowHeight="h40"
          separationLineVariant="backgroundLevel1"
          backgroundVariant="backgroundLevel3"
          customItemKey={(index: number, data: Array<Location>) =>
            data[index].name
          }
          key={(index: number, data: Array<Location>) => data[index].name}
        >
          {(Rows: ComponentType) => <>{Rows}</>}
        </Table.SingleSelectableContent>
      </Table>
    </Box>
  );
}
