import { memo } from 'react';
import type { Dispatch } from 'redux';
import { areEqual } from 'react-window';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';
import { useHistory, useLocation } from 'react-router-dom';

import * as T from '../../ui-elements/Table';
import { toggleAllObjects } from '../../actions';
import type { Action } from '../../../types/actions';
import { useQueryParams } from '../../utils/hooks';
import { removeTrailingSlash } from '../../../js/utils';
import type { ObjectEntity } from '../../../types/s3';

type PrepareRow = (arg0: RowType) => void;
type RowType = {
  id: number;
  original: ObjectEntity;
  cells: any;
  getRowProps: (arg0: any) => void;
};
type RowsType = Array<RowType>;
type Data = {
  rows: RowsType;
  prepareRow: PrepareRow;
  dispatch: Dispatch<Action>;
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
    dispatch: Dispatch<Action>,
  ): Data => ({
    rows,
    prepareRow,
    dispatch,
  }),
  isDeepEqual,
);

// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
  data: { rows, prepareRow, dispatch },
  index,
  style,
}: RowProps) => {
  const row = rows[index];
  prepareRow(row);
  const history = useHistory();
  const { pathname } = useLocation();
  const query = useQueryParams();
  const versionId = query.get('versionId');
  const objectKey = query.get('prefix');
  const isListVersions = query.get('showversions') === 'true';

  const handleClick = () => {
    dispatch(toggleAllObjects(false));
    query.set('prefix', removeTrailingSlash(row.original.key));

    if (row.original.key.slice(-1) === '/') {
      //@ts-expect-error fix this when you are working on it
      query.set('isFolder', true);
    } else {
      query.delete('isFolder');
    }

    if (row.original.versionId) {
      query.set('versionId', row.original.versionId);
    } else {
      query.delete('versionId');
    }

    history.push(`${pathname}?${query.toString()}`);
  };

  const isRowSelected = isListVersions
    ? row.original.versionId === versionId && objectKey === row.original.key
    : objectKey === row.original.key;
  return (
    <T.Row
      isSelected={row.original.toggled || isRowSelected}
      onClick={handleClick}
      //@ts-expect-error fix this when you are working on it
      {...row.getRowProps({
        style,
      })}
    >
      {row.cells.map((cell) => {
        const cellProps = cell.getCellProps();
        return (
          <T.Cell
            shade={!row.original.isLatest}
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
