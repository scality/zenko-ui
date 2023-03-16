import { Location, Replication } from '../../../types/config';
import { useCallback, useMemo, useState, ComponentType } from 'react';
import { HelpLocationTargetBucket } from '../../ui-elements/Help';
import {
  canDeleteLocation,
  canEditLocation,
} from '../../backend/location/utils';
import { deleteLocation, handleClientError, networkEnd } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import type { InstanceStatus } from '../../../types/stats';
import DeleteConfirmation from '../../ui-elements/DeleteConfirmation';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { TitleRow as TableHeader } from '../../ui-elements/TableKeyValue';
import { Table, Button, Box } from '@scality/core-ui/dist/next';
import { useHistory } from 'react-router-dom';
import { CellProps } from 'react-table';
import { useWorkflows } from '../../workflow/Workflows';
import { InlineButton } from '../../ui-elements/Table';
import ColdStorageIcon from '../../ui-elements/ColdStorageIcon';
import { getLocationType } from '../../utils/storageOptions';
import { BucketWorkflowTransitionV2 } from '../../../js/managementClient/api';
import { Icon, Loader } from '@scality/core-ui';
import { useQuery, useQueryClient } from 'react-query';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { useManagementClient } from '../../ManagementProvider';
import { PauseAndResume } from './PauseAndResume';

type LocationRowProps = {
  original: Location;
};

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
  const handleDeleteClick = useCallback(
    (locationName) => dispatch(deleteLocation(locationName)),
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
    </div>
  );
};

function Locations() {
  const dispatch = useDispatch();
  const history = useHistory();
  const workflowsQuery = useWorkflows();
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );

  const buckets = useSelector((state: AppState) => state.stats.bucketList);
  const endpoints = useSelector(
    (state: AppState) => state.configuration.latest.endpoints,
  );
  const data = useMemo(
    () =>
      Object.values(locations).map((location) => ({
        ...location,
        _asyncMetadataUpdatesColumn: true,
        _actionsColumn: true,
      })),
    [locations],
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const instanceId = notFalsyTypeGuard(
    useSelector((state: AppState) => state.instances.selectedId),
  );

  const managementClient = useManagementClient();

  const queryClient = useQueryClient();
  const invalidateInstanceStatusQueryCache = async () => {
    await queryClient.invalidateQueries(['instanceStatus', instanceId]);
    await queryClient.refetchQueries(['instanceStatus', instanceId]);
    dispatch(networkEnd());
  };
  const {
    data: instanceStatus,
    status,
    isFetching,
  } = useQuery({
    queryKey: ['instanceStatus', instanceId],
    queryFn: () => {
      return managementClient.getLatestInstanceStatus(
        instanceId,
      ) as InstanceStatus;
    },
    onError: (error) => {
      dispatch(handleClientError(error));
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const features = useSelector((state: AppState) => state.auth.config.features);
  const SEARCH_QUERY_PARAM = 'search';
  const columns = useMemo(() => {
    const columns = [
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
        accessor: 'locationType',
        cellStyle: {
          textAlign: 'left',
          minWidth: '24rem',
        },
        Cell(value: CellProps<Location>) {
          const rowValues = value.row.original;
          const locationType = getLocationType(rowValues);
          if (rowValues.isCold) {
            return (
              <span>
                <ColdStorageIcon /> {locationType}
              </span>
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
          minWidth: '24rem',
        },
      },
    ];

    columns.push({
      Header: 'Workflow status',
      accessor: '_asyncMetadataUpdatesColumn',
      disableSortBy: true,
      cellStyle: {
        textAlign: 'left',
        minWidth: '12rem',
      },
      Cell: ({ row: { original } }: { row: LocationRowProps }) => (
        <PauseAndResume
          locationName={original.name}
          ingestionStates={instanceStatus?.metrics?.['ingest-schedule']?.states}
          replicationStates={instanceStatus?.metrics?.['crr-schedule']?.states}
          loading={isFetching}
          dispatch={dispatch}
          invalidateInstanceStatusQueryCache={
            invalidateInstanceStatusQueryCache
          }
        />
      ),
    });

    columns.push({
      Header: '',
      accessor: '_actionsColumn',
      cellStyle: {
        textAlign: 'right',
        minWidth: '10rem',
        marginLeft: 'auto',
      },
      disableSortBy: true,
      Cell: (value: CellProps<Location>) => {
        if (
          workflowsQuery.status === 'idle' ||
          workflowsQuery.status === 'loading'
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
    isFetching,
    loading,
    features,
  ]);
  if (Object.keys(locations).length === 0) {
    return (
      <Warning
        icon={<Icon name="Map-marker" size="5x" />}
        title="Create your first storage location."
        btnTitle="Create Location"
        btnAction={() => dispatch(push('/create-location'))}
      />
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Loader>
          <div>Loading</div>
        </Loader>
      </Box>
    );
  }

  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <Table columns={columns} data={data} defaultSortingKey={'name'}>
        <TableHeader>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              textAlign: 'left',
              minWidth: '10rem',
              marginRight: 'auto',
            }}
          >
            <Table.SearchWithQueryParams
              displayedName={{
                singular: 'location',
                plural: 'locations',
              }}
              queryParams={SEARCH_QUERY_PARAM}
            />
          </div>
          <Button
            icon={<Icon name="Create-add" />}
            label="Create Location"
            variant="primary"
            onClick={() => history.push('/create-location')}
            type="submit"
          />
        </TableHeader>
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
    </div>
  );
}

export default Locations;
