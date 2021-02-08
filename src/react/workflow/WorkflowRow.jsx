// @flow

import * as T from '../ui-elements/Table';
import React, { memo } from 'react';
import type { Action } from '../../types/actions';
import type { DispatchAPI } from 'redux';
import type { Rule } from '../../types/config';
import { areEqual } from 'react-window';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';
import { push } from 'connected-react-router';

type PrepareRow = (RowType) => void;

type RowType = {
    id: number,
    original: Rule,
    cells: any,
    getRowProps: (any) => void,
};

type RowsType = Array<RowType>;

type Data = {
    rows: RowsType,
    prepareRow: PrepareRow,
    selectedRuleId: ?string,
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
    selectedRuleId: ?string,
    dispatch: DispatchAPI<Action>
): Data => ({
    rows,
    prepareRow,
    selectedRuleId,
    dispatch,
}), isDeepEqual);

// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({
    data: { rows, prepareRow, selectedRuleId, dispatch },
    index,
    style,
}: RowProps) => {
    const row = rows[index];
    prepareRow(row);
    const ruleId = row.original.id;
    const isSelected = selectedRuleId === ruleId;
    return (
        <T.Row isSelected={isSelected} onClick={() => {
            if (!isSelected) {
                dispatch(push(`/workflows/${ruleId}`));
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
