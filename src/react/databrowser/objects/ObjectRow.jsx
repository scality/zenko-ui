// @flow

import * as T from '../../ui-elements/Table';
import React, { memo } from 'react';
import type { S3Bucket } from '../../../types/s3';
import { areEqual } from 'react-window';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';

type PrepareRow = (RowType) => void;

type RowType = {
    id: number,
    original: S3Bucket,
    cells: any,
    getRowProps: (any) => void,
};

type RowsType = Array<RowType>;

type Data = {
    rows: RowsType,
    prepareRow: PrepareRow,
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
): Data => ({
    rows,
    prepareRow,
}), isDeepEqual);

// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
    data: { rows, prepareRow },
    index,
    style,
}: RowProps) => {
    const row = rows[index];
    prepareRow(row);
    return (
        <T.Row isSelected={false} onClick={() => {}} {...row.getRowProps({ style })}>
            {row.cells.map(cell => (
                <T.Cell key={cell.id} {...cell.getCellProps()} >
                    {cell.render('Cell')}
                </T.Cell>
            ))}
        </T.Row>
    );
};

export default memo<RowProps>(Row, areEqual);
