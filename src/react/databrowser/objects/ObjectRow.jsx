// @flow

import * as T from '../../ui-elements/Table';
import React, { memo } from 'react';
import { toggleAllObjects, toggleObject } from '../../actions';
import type { Action } from '../../../types/actions';
import type { DispatchAPI } from 'redux';
import type { Object } from '../../../types/s3';
import { areEqual } from 'react-window';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';

type PrepareRow = (RowType) => void;

type RowType = {
    id: number,
    original: Object,
    cells: any,
    getRowProps: (any) => void,
};

type RowsType = Array<RowType>;

type Data = {
    rows: RowsType,
    prepareRow: PrepareRow,
    dispatch: DispatchAPI<Action>,
};

type RowProps = {
    data: Data,
    index: number,
    style: Object,
};

// createItemData: This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure MemoRow components.
// This is only needed since we are passing multiple props with a wrapper object.
export const createItemData = memoize((
    rows: RowsType,
    prepareRow: PrepareRow,
    dispatch: DispatchAPI<Action>,
): Data => ({
    rows,
    prepareRow,
    dispatch,
}), isDeepEqual);

// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
    data: { rows, prepareRow, dispatch },
    index,
    style,
}: RowProps) => {
    const row = rows[index];
    prepareRow(row);

    const handleClick = () => {
        dispatch(toggleAllObjects(false));
        dispatch(toggleObject(row.original.name, row.original.versionId));
    };

    return (
        <T.Row isSelected={row.original.toggled} onClick={handleClick} {...row.getRowProps({ style })}>
            {row.cells.map(cell => (
                <T.Cell shade={!row.original.isLatest} key={cell.id} {...cell.getCellProps()} >
                    {cell.render('Cell')}
                </T.Cell>
            ))}
        </T.Row>
    );
};

export default memo<RowProps>(Row, areEqual);
