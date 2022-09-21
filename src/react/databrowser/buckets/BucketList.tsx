import * as L from '../../ui-elements/ListLayout2';
import type { LocationName, Locations } from '../../../types/config';
import MemoRow, { createItemData } from './BucketRow';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { useFilters, useSortBy, useTable } from 'react-table';
import { AutoSizer } from 'react-virtualized';
import { FixedSizeList } from 'react-window';
import type { S3BucketList } from '../../../types/s3';
import { TextAligner } from '../../ui-elements/Utility';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { formatShortDate } from '../../utils';
import {
  getLocationType,
  getLocationIngestionState,
} from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useDispatch, useSelector } from 'react-redux';
import type { WorkflowScheduleUnitState } from '../../../types/stats';
import type { AppState } from '../../../types/state';
import { listBuckets } from '../../actions';
import { XDM_FEATURE } from '../../../js/config';
import { useParams } from 'react-router';
import { Icon } from '@scality/core-ui';
type Props = {
  locations: Locations;
  buckets: S3BucketList;
  selectedBucketName: string | null | undefined;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};
export default function BucketList({
  selectedBucketName,
  buckets,
  locations,
  ingestionStates,
}: Props) {
  const { accountName } = useParams<{ accountName: string }>();
  const dispatch = useDispatch();
  const listRef = useRef(null);
  useEffect(() => {
    dispatch(listBuckets());
  }, []);
  const handleCellClicked = useCallback(
    (name) => (e) => {
      e.stopPropagation();
      dispatch(push(`/accounts/${accountName}/buckets/${name}/objects`));
    },
    [dispatch],
  );
  const features = useSelector((state: AppState) => state.auth.config.features);
  const columns = useMemo(() => {
    const columns = [
      {
        Header: 'Bucket Name',
        accessor: 'Name',

        Cell({ value: name }: { value: string }) {
          return (
            <T.CellClick onClick={handleCellClicked(name)}>{name}</T.CellClick>
          );
        },
      },
      {
        Header: 'Storage Location',
        accessor: 'LocationConstraint',

        Cell({ value: locationName }: { value: LocationName }) {
          const locationType = getLocationType(locations[locationName]);
          return `${locationName || 'us-east-1'} / ${locationType}`;
        },
      },
    ];

    if (features.includes(XDM_FEATURE)) {
      columns.push({
        Header: 'Async Metadata updates',
        accessor: 'LocationConstraint',
        id: 'ingestion',
        disableSortBy: true,

        Cell({ value: locationName }: { value: LocationName }) {
          return getLocationIngestionState(ingestionStates, locationName).value;
        },
      });
    }

    columns.push({
      Header: 'Created on',
      accessor: 'CreationDate',
      headerStyle: {
        textAlign: 'right',
        paddingRight: spacing.sp32,
      },

      Cell({ value }: { value: string }) {
        return (
          <TextAligner
            alignment="right"
            style={{
              paddingRight: spacing.sp16,
            }}
          >
            {formatShortDate(new Date(value))}
          </TextAligner>
        );
      },
    });
    return columns;
  }, [locations, handleCellClicked, ingestionStates, features]);
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
      data: buckets,
      disableSortRemove: true,
      autoResetFilters: false,
      autoResetSortBy: false,
    },
    useFilters,
    useSortBy,
  );
  return (
    <L.ListSection id="bucket-list">
      <T.SearchContainer>
        <T.Search>
          {' '}
          <T.SearchInput
            disableToggle={true}
            placeholder="Search by Bucket Name"
            onChange={(e) => setFilter('Name', e.target.value)}
          />{' '}
        </T.Search>
        <T.ExtraButton
          icon={<Icon name="Create-add" />}
          label="Create Bucket"
          variant="primary"
          onClick={() =>
            dispatch(push(`/accounts/${accountName}/create-bucket`))
          }
          type="submit"
        />
      </T.SearchContainer>
      <T.Container>
        <Table {...getTableProps()}>
          <T.Head>
            {headerGroups.map((headerGroup) => (
              <T.HeadRow
                key={headerGroup.id}
                {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map((column) => {
                  const headerProps = column.getHeaderProps(
                    column.getSortByToggleProps({
                      title: '',
                    }),
                  );
                  return (
                    <T.HeadCell
                      key={column.id}
                      {...headerProps}
                      style={{ ...column.headerStyle, ...headerProps.style }}
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
                  );
                })}
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
                  itemData={createItemData(
                    rows,
                    prepareRow,
                    selectedBucketName,
                    dispatch,
                  )}
                >
                  {MemoRow}
                </FixedSizeList>
              )}
            </AutoSizer>
          </T.BodyWindowing>
        </Table>
      </T.Container>
    </L.ListSection>
  );
}
