// @flow

import * as T from '../../ui-elements/Table';
import React, { memo } from 'react';
import type { Action } from '../../../types/actions';
import type { DispatchAPI } from 'redux';
import type { S3Bucket } from '../../../types/s3';
import { areEqual } from 'react-window';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';
import { push } from 'connected-react-router';

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
    selectedBucketName: ?string,
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
    selectedBucketName: ?string,
    dispatch: DispatchAPI<Action>
): Data => ({
    rows,
    prepareRow,
    selectedBucketName,
    dispatch,
}), isDeepEqual);

// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
    data: { rows, prepareRow, selectedBucketName, dispatch },
    index,
    style,
}: RowProps) => {
    const row = rows[index];
    prepareRow(row);
    const bucketName = row.original.Name;
    const isSelected = selectedBucketName === bucketName;
    return (
        <T.Row isSelected={isSelected} onClick={() => {
            if (!isSelected) {
                dispatch(push(`/buckets/${bucketName}`));
            }
        }} {...row.getRowProps({ style })}>
            {row.cells.map(cell => (
                <T.Cell key={cell.id} {...cell.getCellProps()} >
                    {cell.render('Cell')}
                </T.Cell>
            ))}
        </T.Row>
    );
};

export default memo<RowProps>(Row, areEqual);
