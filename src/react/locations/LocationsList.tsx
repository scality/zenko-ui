import { Icon, IconHelp, Stack, Wrap, spacing } from '@scality/core-ui';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { CellProps, CoreUIColumn } from 'react-table';

import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { BucketWorkflowTransitionV2 } from '../../js/managementClient/api';
import { useWaitForRunningConfigurationVersionToBeUpdated } from '../../js/mutations';
import { Replication } from '../../types/config';
import type { AppState } from '../../types/state';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import {
  queries,
  useAccountsLocationsAndEndpoints,
  useListAccounts,
} from '../next-architecture/domain/business/accounts';
import { useListLocations } from '../next-architecture/domain/business/locations';
import { Location } from '../next-architecture/domain/entities/location';
import { useAccessibleAccountsAdapter } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';
import { ColdStorageIcon } from '../ui-elements/ColdStorageIcon';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { HelpLocationTargetBucket } from '../ui-elements/Help';
import { InlineButton, Search, SearchContainer } from '../ui-elements/Table';
import { Warning } from '../ui-elements/Warning';
import { getLocationType } from '../utils/storageOptions';
import { useWorkflows } from '../workflow/Workflows';
import { PauseAndResume } from './PauseAndResume';
import { getLocationDeletionBlocker } from './utils';
import styled from 'styled-components';

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
  const history = useHistory();
  const buckets = useSelector((state: AppState) => state.stats.bucketList);
  const [showModal, setShowModal] = useState(false);
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const {
    accountsLocationsAndEndpoints,
    refetchAccountsLocationsEndpointsMutation,
  } = useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });

  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const deleteMutation = useMutation({
    mutationFn: async (locationName: string) =>
      notFalsyTypeGuard(managementClient).deleteConfigurationOverlayLocation(
        locationName,
        instanceId,
      ),
  });
  const {
    setReferenceVersion,
    status: waiterStatus,
    waitForRunningConfigurationVersionToBeUpdated,
  } = useWaitForRunningConfigurationVersionToBeUpdated();
  const queryClient = useQueryClient();
  const handleDeleteClick = (locationName: string) => {
    setReferenceVersion({
      onRefTaken: () => {
        deleteMutation.mutate(locationName, {
          onSuccess: () => {
            const newAccountsLocationsEndpoints = {
              ...accountsLocationsAndEndpoints,
              locations: accountsLocationsAndEndpoints?.locations.filter(
                (location) => location.name !== locationName,
              ),
            };

            queryClient.setQueryData(
              queries.listAccountsLocationAndEndpoints(
                accountsLocationsEndpointsAdapter,
              ).queryKey,
              newAccountsLocationsEndpoints,
            );
            waitForRunningConfigurationVersionToBeUpdated();
          },
        });
      },
    });
  };

  useMemo(() => {
    if (waiterStatus === 'success') {
      refetchAccountsLocationsEndpointsMutation.mutate();
    }
  }, [waiterStatus]);

  const { isBuiltin, hasWorkflow, hasBucket, hasEndpoint } =
    getLocationDeletionBlocker(
      rowValues,
      replications,
      transitions,
      buckets,
      accountsLocationsAndEndpoints?.endpoints || [],
    );
  const isDeletionDisabled =
    isBuiltin || hasWorkflow || hasBucket || hasEndpoint;

  const List = styled.ul`
    margin-left: ${spacing.r8};
    li {
      margin-bottom: 0;
    }
  `;

  const TooltipOverlay = () => {
    return isDeletionDisabled ? (
      isBuiltin ? (
        <>You cannot delete a default location</>
      ) : (
        <div>
          You cannot delete this location because it has:
          <List>
            {hasWorkflow && <li>at least one workflow</li>}
            {hasBucket && <li>at least one bucket</li>}
            {hasEndpoint && <li>at least one data service</li>}
          </List>
        </div>
      )
    ) : (
      <>Delete location</>
    );
  };

  const isEditButtonDisabled =
    rowValues.isBuiltin || rowValues.type === 'location-scality-hdclient-v2';

  return (
    <div>
      <DeleteConfirmation
        show={showModal}
        isLoading={deleteMutation.isLoading || waiterStatus === 'waiting'}
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
            tooltip={
              isEditButtonDisabled
                ? {
                    overlay: 'Edit Location is disabled for this location',
                    placement: 'top',
                  }
                : {
                    overlay: 'Edit Location',
                    placement: 'top',
                  }
            }
            disabled={isEditButtonDisabled}
          />
          <InlineButton
            icon={<Icon name="Delete" />}
            variant="danger"
            onClick={() => setShowModal(true)}
            type="button"
            tooltip={{
              overlay: <TooltipOverlay />,
              overlayStyle: { textAlign: 'left' },
            }}
            disabled={isDeletionDisabled}
          />
        </Stack>
      </Wrap>
    </div>
  );
};

export function LocationsList() {
  const history = useHistory();
  const workflowsQuery = useWorkflows();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const metricsAdapter = useMetricsAdapter();
  const { locations } = useListLocations({
    accountsLocationsEndpointsAdapter,
    metricsAdapter,
  });
  const { accountsLocationsAndEndpoints } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter,
  });

  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();

  const { accounts } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  const buckets = useSelector((state: AppState) => state.stats.bucketList);

  const data = useMemo(() => {
    if (locations.status === 'success') return Object.values(locations.value);
    else return [];
  }, [locations]);
  const loadingBuckets = useSelector(
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
        //@ts-expect-error fix this when you are working on it
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
            //@ts-expect-error fix this when you are working on it
            replications={workflowsQuery.data?.replications || []}
            transitions={workflowsQuery.data?.transitions || []}
          />
        );
      },
    });
    return columns;
  }, [
    locations,
    buckets,
    accountsLocationsAndEndpoints?.endpoints,
    workflowsQuery.data?.replications,
    loadingBuckets,
  ]);

  if (locations.status === 'loading' || locations.status === 'unknown') {
    return <>Loading...</>;
  }

  if (data.length === 0) {
    return (
      <Warning
        icon={<Icon name="Map-marker" size="5x" />}
        title="Create your first storage location."
        btnTitle="Create Location"
        btnAction={() => history.push('/create-location')}
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
          //@ts-expect-error fix this when you are working on it
          customItemKey={(index: number, data: Array<Location>) =>
            data[index].name
          }
          //@ts-expect-error fix this when you are working on it
          key={(index: number, data: Array<Location>) => data[index].name}
        >
          {(Rows) => <>{Rows}</>}
        </Table.SingleSelectableContent>
      </Table>
    </Box>
  );
}
