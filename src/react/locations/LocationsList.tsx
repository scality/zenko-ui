import { Banner, EmptyState, Icon, IconHelp, Loader, Stack, spacing, Wrap } from '@scality/core-ui';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate, useShellHooks } from '@scality/module-federation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import type { CellProps, CoreUIColumn } from 'react-table';
import styled from 'styled-components';
import { useWaitForRunningConfigurationVersionToBeUpdated } from '../../js/mutations';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { queries, useLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useListLocations } from '../next-architecture/domain/business/locations';
import type { Location } from '../next-architecture/domain/entities/location';
import { useLocationsEndpointsAdapter } from '../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';
import { useBucketList } from '../queries/instanceStatusQuery';
import { ColdStorageIcon } from '../ui-elements/ColdStorageIcon';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { HelpLocationTargetBucket } from '../ui-elements/Help';
import { TableHeaderWrapper } from '../ui-elements/Table';
import { getLocationType } from '../utils/storageOptions';
import { useCRRFeature } from './CRRSetupWizard/hooks/useCRRFeature';
import { PauseAndResume } from './PauseAndResume';
import { getLocationDeletionBlocker } from './utils';

const TooltipList = styled.ul`
  margin-left: ${spacing.r8};
  li {
    margin-bottom: 0;
  }
`;

/**
 * Action buttons for location row.
 */
const ActionButtons = ({ rowValues }: { rowValues: Location }) => {
  const { name: locationName } = rowValues;
  const navigate = useBasenameRelativeNavigate();
  const { bucketList: buckets, status: bucketListStatus } = useBucketList();
  const [showModal, setShowModal] = useState(false);
  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints, refetchLocationsEndpointsMutation } = useLocationsAndEndpoints(
    { locationsEndpointsAdapter },
  );

  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const deleteMutation = useMutation({
    mutationFn: async (locationName: string) => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      return client.deleteConfigurationOverlayLocation(locationName, instanceId);
    },
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
            const newLocationsEndpoints = {
              ...locationsAndEndpoints,
              locations: locationsAndEndpoints?.locations.filter((location) => location.name !== locationName),
            };

            queryClient.setQueryData(
              queries.listLocationsAndEndpoints(locationsEndpointsAdapter).queryKey,
              newLocationsEndpoints,
            );
            waitForRunningConfigurationVersionToBeUpdated();
          },
        });
      },
    });
  };

  useEffect(() => {
    if (waiterStatus === 'success') {
      refetchLocationsEndpointsMutation.mutate();
    }
  }, [waiterStatus]);

  const { isBuiltin, hasBucket, hasEndpoint } = getLocationDeletionBlocker(
    rowValues,
    buckets,
    locationsAndEndpoints?.endpoints || [],
  );
  // Disable deletion while bucket list is still loading to prevent incorrect state
  const isDataLoading = bucketListStatus === 'loading' || bucketListStatus === 'idle';
  const isDeletionDisabled = isBuiltin || hasBucket || hasEndpoint || isDataLoading;

  const TooltipOverlay = () => {
    return isDeletionDisabled ? (
      isBuiltin ? (
        <>You cannot delete a default location</>
      ) : (
        <div>
          You cannot delete this location because it has:
          <TooltipList>
            {hasBucket && <li>at least one bucket</li>}
            {hasEndpoint && <li>at least one data service</li>}
          </TooltipList>
        </div>
      )
    ) : (
      <>Delete location</>
    );
  };
  const deleteLocationButtonAriaLabel = isDeletionDisabled
    ? 'Delete Location is disabled for this location'
    : 'Delete Location';

  const isEditButtonDisabled = rowValues.isBuiltin || rowValues.type === 'location-scality-hdclient-v2';

  return (
    <div>
      <DeleteConfirmation
        show={showModal}
        isLoading={deleteMutation.isLoading || waiterStatus === 'waiting'}
        cancel={() => setShowModal(false)}
        approve={() => handleDeleteClick(locationName)}
        titleText={
          <>
            Permanently remove the following location {locationName}?
            <Box marginTop={spacing.r16}>
              <Banner variant="warning" icon={<Icon name="Exclamation-circle" color="statusWarning" />}>
                Please ensure this location is not used by any replication or lifecycle rules before deleting.
              </Banner>
            </Box>
          </>
        }
      />
      <Wrap>
        <div></div>
        <Stack gap={'r8'}>
          <Button
            icon={<Icon name="Edit" />}
            variant="secondary"
            size="inline"
            onClick={() => navigate(`/locations/${locationName}/edit`)}
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
          <Button
            size="inline"
            icon={<Icon name="Delete" />}
            variant="danger"
            onClick={() => setShowModal(true)}
            type="button"
            tooltip={{
              overlay: <TooltipOverlay />,
              overlayStyle: { textAlign: 'left' },
            }}
            aria-label={deleteLocationButtonAriaLabel}
            disabled={isDeletionDisabled}
          />
        </Stack>
      </Wrap>
    </div>
  );
};

export function LocationsList() {
  const navigate = useBasenameRelativeNavigate();
  const isCRRWizardEnabled = useCRRFeature();
  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();
  const metricsAdapter = useMetricsAdapter();
  const { locations } = useListLocations({
    locationsEndpointsAdapter,
    metricsAdapter,
  });
  const { locationsAndEndpoints } = useLocationsAndEndpoints({
    locationsEndpointsAdapter,
  });

  const data = useMemo(() => {
    if (locations.status === 'success') return Object.values(locations.value);
    else return [];
  }, [locations]);

  const { basePath } = useConfig();

  const SEARCH_QUERY_PARAM = 'search';
  const columns = useMemo(() => {
    const dataUsedColumn = getDataUsedColumn(
      (location: Location) => {
        return location;
      },
      { flex: '0.4' },
    );

    const columns: CoreUIColumn<Location>[] = [
      {
        Header: 'Location Name',
        accessor: 'name',
        cellStyle: {
          textAlign: 'left',
          minWidth: '10rem',
          flex: 1,
          width: 'unset',
        },
      },
      {
        Header: 'Location Type',
        accessor: 'type',
        cellStyle: {
          textAlign: 'left',
          minWidth: '10rem',
          flex: 1,
          width: 'unset',
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
          width: 'unset',
        },
      },
      dataUsedColumn,
    ];

    columns.push({
      Header: (
        <>
          Replication status{' '}
          <IconHelp
            placement="top"
            overlayStyle={{ width: '24rem' }}
            tooltipMessage={
              <>
                Pausing the replication will halt asynchronous metadata updates and replication targeting this location.
                <br /> <br />
                Any new object added to the source location will be queued and processed only once the replication is
                resumed.
              </>
            }
          />
        </>
      ),
      accessor: 'id',
      disableSortBy: true,
      cellStyle: {
        textAlign: 'left',
        flex: '0.5',
        width: 'unset',
      },
      Cell: ({ row: { original } }) => <PauseAndResume locationName={original.name} />,
    });

    columns.push({
      Header: '',
      accessor: 'details',
      cellStyle: {
        textAlign: 'right',
        minWidth: '5rem',
        marginLeft: 'auto',
        flex: '0.2',
        paddingRight: '18px',
        width: 'unset',
      },
      disableSortBy: true,
      Cell: (value: CellProps<Location>) => {
        return <ActionButtons rowValues={value.row.original} />;
      },
    });
    return columns;
  }, [locations]);

  if (locations.status === 'loading' || locations.status === 'unknown') {
    return (
      <Loader centered size="massive">
        <>Loading Locations...</>
      </Loader>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon="Map-marker"
        link={`${basePath}/create-location`}
        listedResource={{ singular: 'location', plural: 'locations' }}
      />
    );
  }

  return (
    <Box display="flex" flexDirection="column" flex="1" id="endpoint-list">
      <Table
        columns={columns}
        status={locations.status}
        data={data}
        defaultSortingKey={'name'}
        entityName={{
          en: {
            singular: 'location',
            plural: 'locations',
          },
        }}
      >
        <TableHeaderWrapper
          search={<Table.SearchWithQueryParams queryParams={SEARCH_QUERY_PARAM} />}
          actions={
            <Stack gap="r16">
              {isCRRWizardEnabled && (
                <Button
                  label="Start CRR Configuration"
                  variant="secondary"
                  onClick={() => navigate('/create-crr-configuration')}
                />
              )}
              <Button
                icon={<Icon name="Create-add" />}
                label="Create Location"
                variant="primary"
                onClick={() => navigate('/create-location')}
                type="submit"
              />
            </Stack>
          }
        />

        <Table.SingleSelectableContent
          id="singleTable"
          rowHeight="h40"
          separationLineVariant="backgroundLevel1"
          //@ts-expect-error fix this when you are working on it
          customItemKey={(index: number, data: Array<Location>) => data[index].name}
          //@ts-expect-error fix this when you are working on it
          key={(index: number, data: Array<Location>) => data[index].name}
        >
          {(Rows) => <>{Rows}</>}
        </Table.SingleSelectableContent>
      </Table>
    </Box>
  );
}
