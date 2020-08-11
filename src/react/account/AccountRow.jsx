// @flow

import * as T from '../ui-elements/Table';
import React, { memo } from 'react';
import type { Action } from '../../types/actions';
import type { DispatchAPI } from 'redux';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';
import { push } from 'connected-react-router';

type Data = {
    rows: Array<T>,
    prepareRow: (T) => void,
    accountNameParam: string,
    dispatch: DispatchAPI<Action>,
};

type RowProps = {
    data: Data,
    index: number,
    style: Object,
};
// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({ data: { rows, prepareRow, accountNameParam, dispatch }, index, style }: RowProps) => {
    const row = rows[index];
    prepareRow(row);
    const accountName = row.original.userName;
    console.log('accountName!!!', accountName);
    console.log('accountNameParam!!!', accountNameParam);
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

// shallow compare 2 objects.
function shallowObjectDiffers(prev: Object, next: Object): boolean {
    for (let attribute in prev) {
        if (!(attribute in next)) {
            return true;
        }
    }
    for (let attribute in next) {
        if (prev[attribute] !== next[attribute]) {
            return true;
        }
    }
    return false;
}

// createItemData: This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure MemoRow components.
// This is only needed since we are passing multiple props with a wrapper object.
export const createItemData = memoize((rows, prepareRow, accountNameParam, dispatch): Data =>
    ({ rows, prepareRow, accountNameParam, dispatch }), isDeepEqual);

// using React.memo to avoid unnecessary re-renders.
const MemoRow = memo<RowProps>(Row, (prevProps, nextProps) => {
    return !shallowObjectDiffers(prevProps.style, nextProps.style)
        // WARNING: The following optimization avoid rerendering when new instance status is loaded
        // with data equal by value but not by reference (every 10 seconds).
        // NOTE: use react-window.areEqual instead if side effects occur.
        // should rerender when sorted
        && prevProps.data.rows[0].id === nextProps.data.rows[0].id
        // should rerender when add new account/ delete account or filter
        && prevProps.data.rows.length === nextProps.data.rows.length
        // should rerender when account selected
        && prevProps.data.accountNameParam === nextProps.data.accountNameParam;
});

export default MemoRow;
