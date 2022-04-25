import * as T from '../ui-elements/Table';
import React, { memo } from 'react';
import type { Account } from '../../types/account';
import type { Action } from '../../types/actions';
import type { DispatchAPI } from 'redux';
import { areEqual } from 'react-window';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';
import { push } from 'connected-react-router';
type PrepareRow = (arg0: RowType) => void;
type RowType = {
  id: number;
  original: Account;
  cells: any;
  getRowProps: (arg0: any) => void;
};
type RowsType = Array<RowType>;
type Data = {
  rows: RowsType;
  prepareRow: PrepareRow;
  accountNameParam: string | null | undefined;
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
    accountNameParam: string | null | undefined,
    dispatch: DispatchAPI<Action>,
  ): Data => ({
    rows,
    prepareRow,
    accountNameParam,
    dispatch,
  }),
  isDeepEqual,
);

// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
  data: { rows, prepareRow, accountNameParam, dispatch },
  index,
  style,
}: RowProps) => {
  const row = rows[index];
  prepareRow(row);
  const accountName = row.original.Name;
  const isSelected = accountName === accountNameParam;
  return (
    <T.Row
      isSelected={isSelected}
      onClick={() => {
        if (!isSelected) {
          dispatch(push(`/accounts/${accountName}`));
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
