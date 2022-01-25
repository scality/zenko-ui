// @flow
import type { LocationName, LocationType } from '../../../types/config';
import React, { useCallback, useMemo, useRef } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { HelpLocationTargetBucket } from '../../ui-elements/Help';
import {
  canDeleteLocation,
  canEditLocation,
  IngestionCell,
} from '../../backend/location/utils';
import {
  closeLocationDeleteDialog,
  deleteLocation,
  openLocationDeleteDialog,
} from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { AppState } from '../../../types/state';
import DeleteConfirmation from '../../ui-elements/DeleteConfirmation';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { storageOptions } from '../../backend/location/LocationDetails';
import styled from 'styled-components';
import { useHeight } from '../../utils/hooks';
import { XDM_FEATURE } from '../../../js/config';

const initialSortBy = [
  {
    id: 'name',
    desc: false,
  },
];

const CustomBody = styled(T.Body)`
  flex: 1;
  overflow: visible;
`;

export const Sizer = styled.div`
  height: ${props => (props.height ? `${props.height}px` : '300px')};
  width: 100%;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 500px;
`;

function Locations() {
  const dispatch = useDispatch();

  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const replicationStreams = useSelector(
    (state: AppState) => state.workflow.replications,
  );
  const buckets = useSelector((state: AppState) => state.stats.bucketList);
  const endpoints = useSelector(
    (state: AppState) => state.configuration.latest.endpoints,
  );
  const data = useMemo(() => Object.values(locations), [locations]);

  const showDeleteLocationName = useSelector(
    (state: AppState) => state.uiLocations.showDeleteLocation,
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

  const handleDeleteClick = useCallback(
    locationName => dispatch(openLocationDeleteDialog(locationName)),
    [dispatch],
  );

  const features = useSelector((state: AppState) => state.auth.config.features);

  const resizerRef = useRef<T.Resizer<T> | null>(null);
  const height = useHeight(resizerRef);

  const columns = useMemo(() => {
    const columns = [
      {
        Header: 'Location Name',
        accessor: 'name',
      },
      {
        Header: 'Location Type',
        accessor: 'locationType',
        Cell({ value: locationType }: { value: LocationType }) {
          return storageOptions[locationType]?.name || 'N/A';
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
      },
    ];

    if (features.includes(XDM_FEATURE)) {
      columns.push({
        id: 'ingestion',
        Header: 'Async Metadata updates',
        accessor: 'name',
        disableSortBy: true,
        cellStyle: { overflow: 'visible' },
        Cell: IngestionCell(ingestionStates, capabilities, loading, dispatch),
      });
    }

    columns.push({
      id: 'actions',
      Header: '',
      accessor: 'name',
      cellStyle: { overflow: 'visible' },
      disableSortBy: true,
      Cell({ value: locationName }: { value: LocationName }) {
        return (
          <T.Actions>
            <T.ActionButton
              disabled={!canEditLocation(locationName, locations)}
              icon={<i className="far fa-edit" />}
              tooltip={{ overlay: 'Edit Location', placement: 'top' }}
              onClick={() => dispatch(push(`/locations/${locationName}/edit`))}
              variant="secondary"
            />
            <T.ActionButton
              disabled={
                !canDeleteLocation(
                  locationName,
                  locations,
                  replicationStreams,
                  buckets,
                  endpoints,
                )
              }
              icon={<i className="fas fa-trash" />}
              tooltip={{ overlay: 'Delete Location', placement: 'top' }}
              onClick={() => handleDeleteClick(locationName)}
              variant="danger"
            />
          </T.Actions>
        );
      },
    });
    return columns;
  }, [
    dispatch,
    locations,
    buckets,
    endpoints,
    replicationStreams,
    handleDeleteClick,
    ingestionStates,
    loading,
    capabilities,
    features,
  ]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    setFilter,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      initialState: { sortBy: initialSortBy },
      disableSortRemove: true,
      autoResetFilters: false,
      autoResetSortBy: false,
    },
    useFilters,
    useSortBy,
  );

  // NOTE: empty state component
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
    <Container id="location-list">
      <T.SearchContainer>
        <T.Search>
          {' '}
          <T.SearchInput
            disableToggle={true}
            placeholder="Search by Location Name"
            onChange={e => setFilter('name', e.target.value)}
          />{' '}
        </T.Search>
        <T.ExtraButton
          label="Create Location"
          icon={<i className="fas fa-plus" />}
          variant="primary"
          onClick={() => dispatch(push('/create-location'))}
          type="submit"
        />
      </T.SearchContainer>
      <T.Container>
        <Table {...getTableProps()}>
          <T.Head>
            {headerGroups.map(headerGroup => (
              <T.HeadRow
                key={headerGroup.id}
                {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map(column => (
                  <T.HeadCell
                    key={column.id}
                    {...column.getHeaderProps(
                      column.getSortByToggleProps({ title: '' }),
                    )}
                  >
                    {column.render('Header')}
                    <T.Icon>
                      {!column.disableSortBy &&
                        (column.isSorted ? (
                          column.isSortedDesc ? (
                            <i className="fas fa-sort-down" />
                          ) : (
                            <i className="fas fa-sort-up" />
                          )
                        ) : (
                          <i className="fas fa-sort" />
                        ))}
                    </T.Icon>
                  </T.HeadCell>
                ))}
              </T.HeadRow>
            ))}
          </T.Head>
          <CustomBody {...getTableBodyProps()} ref={resizerRef}>
            <Sizer height={height}>
              {rows.map(row => {
                prepareRow(row);
                const locationName = row.original.name;
                return (
                  <T.Row isSelected={false} key={row.id} {...row.getRowProps()}>
                    <DeleteConfirmation
                      show={
                        showDeleteLocationName &&
                        showDeleteLocationName === locationName
                      }
                      cancel={() => dispatch(closeLocationDeleteDialog())}
                      approve={() => dispatch(deleteLocation(locationName))}
                      titleText={`Are you sure you want to delete location: ${locationName} ?`}
                    />
                    {row.cells.map(cell => {
                      const cellProps = cell.getCellProps();
                      return (
                        <T.Cell
                          key={cell.id}
                          {...cellProps}
                          style={{
                            ...cell.column.cellStyle,
                            ...cellProps.style,
                          }}
                        >
                          {cell.render('Cell')}
                        </T.Cell>
                      );
                    })}
                  </T.Row>
                );
              })}
            </Sizer>
          </CustomBody>
        </Table>
      </T.Container>
    </Container>
  );
}

export default Locations;
