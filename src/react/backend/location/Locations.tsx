import { Location, Replication } from '../../../types/config';
import { useCallback, useMemo, useState, ComponentType } from 'react';
import { HelpLocationTargetBucket } from '../../ui-elements/Help';
import {
  canDeleteLocation,
  canEditLocation,
  IngestionCell,
} from '../../backend/location/utils';
import { deleteLocation } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import DeleteConfirmation from '../../ui-elements/DeleteConfirmation';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { XDM_FEATURE } from '../../../js/config';
import { TitleRow as TableHeader } from '../../ui-elements/TableKeyValue';
import { Table, Button } from '@scality/core-ui/dist/next';
import { useHistory } from 'react-router-dom';
import { CellProps } from 'react-table';
import { useWorkflows } from '../../workflow/Workflows';
import { InlineButton } from '../../ui-elements/Table';
import ColdStorageIcon from '../../ui-elements/ColdStorageIcon';
import { getLocationType } from '../../utils/storageOptions';

const ActionButtons = ({
  rowValues,
  replications,
}: {
  rowValues: Location;
  replications: Replication[];
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
        icon={<i className="far fa-edit" />}
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
        icon={<i className="fas fa-trash" />}
        variant="danger"
        onClick={() => setShowModal(true)}
        type="button"
        tooltip={{
          overlay: 'Delete Location',
          placement: 'top',
        }}
        disabled={
          !canDeleteLocation(
            locationName,
            locations,
            replications,
            buckets,
            endpoints,
          )
        }
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
  const ingestionStates = useSelector(
    (state: AppState) =>
      state.instanceStatus.latest.metrics?.['ingest-schedule']?.states,
  );
  const capabilities = useSelector(
    (state: AppState) => state.instanceStatus.latest.state.capabilities,
  );
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
            Target Bucket
            <HelpLocationTargetBucket />
          </>
        ),
        accessor: 'details.bucketName',
        cellStyle: {
          textAlign: 'left',
          minWidth: '24rem',
        },
      },
    ];

    if (features.includes(XDM_FEATURE)) {
      columns.push({
        Header: 'Async Metadata updates',
        accessor: '_asyncMetadataUpdatesColumn',
        disableSortBy: true,
        cellStyle: {
          textAlign: 'left',
          minWidth: '12rem',
        },
        Cell: IngestionCell(ingestionStates, capabilities, loading, dispatch),
      });
    }

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
    ingestionStates,
    loading,
    capabilities,
    features,
  ]);
  if (Object.keys(locations).length === 0) {
    return (
      <Warning
        iconClass="fas fa-5x fa-map-marker-alt"
        title="Create your first storage location."
        btnTitle="Create Location"
        btnAction={() => dispatch(push('/create-location'))}
      />
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
            icon={<i className="fas fa-plus" />}
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
