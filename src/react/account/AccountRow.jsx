// @flow

import * as T from '../ui-elements/Table';
import React, { memo } from 'react';
import type { Account } from '../../types/account';
import type { Action } from '../../types/actions';
import type { DispatchAPI } from 'redux';
import { areEqual } from 'react-window';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';
import { push } from 'connected-react-router';

type PrepareRow = (RowType) => void;

type RowType = {
    id: number,
    original: Account,
    cells: any,
    getRowProps: (any) => void,
};

type RowsType = Array<RowType>;

type Data = {
    rows: RowsType,
    prepareRow: PrepareRow,
    accountNameParam: ?string,
    dispatch: DispatchAPI<Action>,
};

type RowProps = {
    data: Data,
    index: number,
    style: Object,
};
// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
    data: { rows, prepareRow, accountNameParam, dispatch },
    index,
    style,
}: RowProps) => {
    const row = rows[index];
    prepareRow(row);
    const accountName = row.original.userName;
    return (
        <T.Row isSelected={accountName === accountNameParam} onClick={() => {
            if (accountName !== accountNameParam) {
                dispatch(push(`/accounts/${accountName}`));
            }
        }} key={row.id} {...row.getRowProps({ style })}>
            {row.cells.map(cell => {
                return (
                    <T.Cell key={cell.id} {...cell.getCellProps()} >
                        {cell.render('Cell')}
                    </T.Cell>
                );
            })}
        </T.Row>
    );
};

const MemoRow = memo<RowProps>(Row, areEqual);

// createItemData: This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure MemoRow components.
// This is only needed since we are passing multiple props with a wrapper object.
export const createItemData = memoize((
    rows: RowsType,
    prepareRow: PrepareRow,
    accountNameParam: ?string,
    dispatch: DispatchAPI<Action>
): Data => ({ rows, prepareRow, accountNameParam, dispatch }), isDeepEqual);

export default MemoRow;
