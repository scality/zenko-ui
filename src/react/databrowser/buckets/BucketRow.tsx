import { memo } from 'react';
import { useHistory } from 'react-router-dom';
import { areEqual } from 'react-window';
import memoize from 'memoize-one';
import type { DispatchAPI } from 'redux';

import type { Action } from '../../../types/actions';
import type { S3Bucket } from '../../../types/s3';
import isDeepEqual from 'lodash.isequal';

import { useQueryParams } from '../../utils/hooks';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import * as T from '../../ui-elements/Table';

type PrepareRow = (arg0: RowType) => void;
type RowType = {
  id: number;
  original: S3Bucket;
  cells: any;
  getRowProps: (arg0: any) => void;
};
type RowsType = Array<RowType>;
type Data = {
  rows: RowsType;
  prepareRow: PrepareRow;
  selectedBucketName: string | null | undefined;
  dispatch: DispatchAPI<Action>;
};
type RowProps = {
  data: Data;
  index: number;
  style: Record<string, any>;
};
// createItemData: This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure MemoRow components.
// This is only needed since we are passing multiple props with a wrapper object.
export const createItemData = memoize(
  (
    rows: RowsType,
    prepareRow: PrepareRow,
    selectedBucketName: string | null | undefined,
    dispatch: DispatchAPI<Action>,
  ): Data => ({
    rows,
    prepareRow,
    selectedBucketName,
    dispatch,
  }),
  isDeepEqual,
);

// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
  data: { rows, prepareRow, selectedBucketName },
  index,
  style,
}: RowProps) => {
  const history = useHistory();
  const row = rows[index];
  prepareRow(row);
  const bucketName = row.original.Name;
  const isSelected = selectedBucketName === bucketName;
  const query = useQueryParams();
  const { account } = useCurrentAccount();
  const tabName = query.get('tab');
  return (
    <T.Row
      isSelected={isSelected}
      onClick={() => {
        if (!isSelected) {
          history.push(
            tabName
              ? `/accounts/${account.Name}/buckets/${bucketName}?tab=${tabName}`
              : `/accounts/${account.Name}/buckets/${bucketName}`,
          );
        }
      }}
      {...row.getRowProps({
        style,
      })}
    >
      {row.cells.map((cell) => {
        const cellProps = cell.getCellProps();
        return (
          <T.Cell
            key={cell.id}
            {...cellProps}
            style={{ ...cell.column.cellStyle, ...cellProps.style }}
          >
            {cell.render('Cell')}
          </T.Cell>
        );
      })}
    </T.Row>
  );
};

export default memo<RowProps>(Row, areEqual);
