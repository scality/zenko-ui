// @flow
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
  getLocationTypeFromName,
  getLocationIngestionState,
} from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useDispatch } from 'react-redux';
import type { WorkflowScheduleUnitState } from '../../../types/stats';
import { listBuckets } from '../../actions';

type Props = {
  locations: Locations,
  buckets: S3BucketList,
  selectedBucketName: ?string,
  ingestionStates: ?WorkflowScheduleUnitState,
};
export default function BucketList({
  selectedBucketName,
  buckets,
  locations,
  ingestionStates,
}: Props) {
  const dispatch = useDispatch();
  const listRef = useRef<FixedSizeList<T> | null>(null);

  useEffect(() => {
    dispatch(listBuckets());
  }, []);

  const handleCellClicked = useCallback(
    name => e => {
      e.stopPropagation();
      dispatch(push(`/buckets/${name}/objects`));
    },
    [dispatch],
  );

  const columns = useMemo(
    () => [
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
          const locationType = getLocationTypeFromName(locationName, locations);
          return `${locationName || 'us-east-1'} / ${locationType}`;
        },
      },
      {
        Header: 'Async Notification',
        accessor: 'LocationConstraint',
        id: 'ingestion',
        disableSortBy: true,
        Cell({ value: locationName }: { value: LocationName }) {
          return getLocationIngestionState(ingestionStates, locationName).value;
        },
      },
      {
        Header: 'Created on',
        accessor: 'CreationDate',
        headerStyle: { textAlign: 'right', paddingRight: spacing.sp32 },
        Cell({ value }: { value: string }) {
          return (
            <TextAligner
              alignment="right"
              style={{ paddingRight: spacing.sp16 }}
            >
              {formatShortDate(new Date(value))}
            </TextAligner>
          );
        },
      },
    ],
    [locations, handleCellClicked, ingestionStates],
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
            onChange={e => setFilter('Name', e.target.value)}
          />{' '}
        </T.Search>
        <T.ExtraButton
          icon={<i className="fas fa-plus" />}
          label="Test"
          variant="primary"
          onClick={async () => {
            console.log('clicked');
            let res = await window.userManager.signinSilent();
            console.log('res', res);
          }}
          type="button"
        />
        <T.ExtraButton
          icon={<i className="fas fa-plus" />}
          label="Create Bucket"
          variant="primary"
          onClick={() => dispatch(push('/create-bucket'))}
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
                {headerGroup.headers.map(column => {
                  const headerProps = column.getHeaderProps(
                    column.getSortByToggleProps({ title: '' }),
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
                              <i className="fas fa-sort-down" />
                            ) : (
                              <i className="fas fa-sort-up" />
                            )
                          ) : (
                            <i className="fas fa-sort" />
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
              {({ height, width }) => (
                // ISSUE: https://github.com/bvaughn/react-window/issues/504
                // eslint-disable-next-line flowtype-errors/show-errors
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
