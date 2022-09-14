import type {
  Endpoint,
  LocationName,
  Hostname,
  Locations,
} from '../../types/config';
import MemoRow, { createItemData } from './EndpointRow';
import { useMemo, useRef } from 'react';
import { Button } from '@scality/core-ui/dist/next';
import Table, * as T from '../ui-elements/Table';
import {
  closeEndpointDeleteDialog,
  deleteEndpoint,
  openEndpointDeleteDialog,
} from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { AppState } from '../../types/state';
import { AutoSizer } from 'react-virtualized';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { FixedSizeList } from 'react-window';
import { ListSection } from '../ui-elements/ListLayout4';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { getLocationType } from '../utils/storageOptions';
import { push } from 'connected-react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Clipboard } from '../ui-elements/Clipboard';
import { AuthorizedAdvancedMetricsButton } from './AdvancedMetricsButton';
import { Icon } from '@scality/core-ui';
type CellProps = {
  row: {
    original: Endpoint;
  };
};
type Props = {
  endpoints: Array<Endpoint>;
  locations: Locations;
};

function EndpointList({ endpoints, locations }: Props) {
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const showDelete = useSelector(
    (state: AppState) => state.uiEndpoints.showDelete,
  );

  const handleDeleteApprove = () => {
    if (!showDelete) {
      return;
    }

    dispatch(deleteEndpoint(showDelete));
  };

  const handleDeleteCancel = () => {
    dispatch(closeEndpointDeleteDialog());
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Hostname',
        accessor: 'hostname',
        Cell({ value: hostName }: { value: Hostname }) {
          return (
            <div style={{ display: 'flex' }}>
              <span style={{ paddingRight: spacing.sp14 }}>{hostName}</span>
              <Clipboard text={hostName} />
            </div>
          );
        },
      },
      {
        Header: 'Location name',
        accessor: 'locationName',

        Cell({ value: locationName }: { value: LocationName }) {
          const locationType = getLocationType(locations[locationName]);
          return (
            <span>
              {' '}
              {locationName} <small>({locationType})</small>{' '}
            </span>
          );
        },
      },
      {
        id: 'action',
        Header: '',
        accessor: 'isBuiltin',
        disableSortBy: true,

        Cell({ row: { original } }: CellProps) {
          return (
            <T.Actions>
              <T.ActionButton
                disabled={original.isBuiltin}
                icon={<Icon name="Delete" />}
                tooltip={{
                  overlay: 'Delete Data Service',
                  placement: 'top',
                }}
                onClick={() =>
                  dispatch(openEndpointDeleteDialog(original.hostname))
                }
                variant="danger"
              />
            </T.Actions>
          );
        },
      },
    ],
    [locations, dispatch],
  );
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
      data: endpoints,
      disableSortRemove: true,
      autoResetFilters: false,
      autoResetSortBy: false,
    },
    useFilters,
    useSortBy,
  );
  return (
    <ListSection id="endpoint-list">
      <DeleteConfirmation
        show={!!showDelete}
        cancel={handleDeleteCancel}
        approve={handleDeleteApprove}
        titleText={`Are you sure you want to delete Data Service: ${showDelete} ?`}
      />
      <T.SearchContainer>
        <T.Search>
          <T.SearchInput
            disableToggle={true}
            placeholder="Search by Hostname"
            onChange={(e) => setFilter('hostname', e.target.value)}
          />
        </T.Search>
        <div style={{ marginLeft: 'auto' }}>
          <Button
            icon={<Icon name="Create-add" />}
            label="Create Data Service"
            variant="primary"
            onClick={() => dispatch(push('/create-dataservice'))}
            type="submit"
          />
          <AuthorizedAdvancedMetricsButton />
        </div>
      </T.SearchContainer>
      <T.Container>
        <Table {...getTableProps()}>
          <T.Head>
            {headerGroups.map((headerGroup) => (
              <T.HeadRow
                key={headerGroup.id}
                {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map((column) => (
                  <T.HeadCell
                    key={column.id}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                  >
                    {column.render('Header')}
                    <T.Icon>
                      {!column.disableSortBy &&
                        (column.isSorted ? (
                          column.isSortedDesc ? (
                            <Icon name="Sort-down" />
                          ) : (
                            <Icon name="Sort-up" />
                          )
                        ) : (
                          <Icon name="Sort" />
                        ))}
                    </T.Icon>
                  </T.HeadCell>
                ))}
              </T.HeadRow>
            ))}
          </T.Head>
          <T.BodyWindowing {...getTableBodyProps()}>
            <AutoSizer>
              {(
                { height, width }, // ISSUE: https://github.com/bvaughn/react-window/issues/504
              ) => (
                <FixedSizeList
                  ref={listRef}
                  height={height || 300}
                  itemCount={rows.length}
                  itemSize={convertRemToPixels(parseFloat(spacing.sp40)) || 45}
                  width={width || '100%'}
                  itemData={createItemData(rows, prepareRow)}
                >
                  {MemoRow}
                </FixedSizeList>
              )}
            </AutoSizer>
          </T.BodyWindowing>
        </Table>
      </T.Container>
    </ListSection>
  );
}

export default EndpointList;
