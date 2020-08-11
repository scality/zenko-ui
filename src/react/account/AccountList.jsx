// @flow
import { FixedSizeList, areEqual } from 'react-window';
import React, { memo, useEffect, useRef } from 'react';
import Table, * as T from '../ui-elements/Table';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { AppState } from '../../types/state';
import { Warning } from '../ui-elements/Warning';
import { formatDate } from '../utils';
import isDeepEqual from 'lodash.isequal';
import memoize from 'memoize-one';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';

export const Icon = styled.i`
    margin-left: 5px;
`;

const columns = [
    {
        Header: 'Name',
        accessor: 'userName',
    },
    {
        Header: 'Created on',
        accessor: 'createDate',
        Cell: ({ value }) => { return formatDate(new Date(value));},
    },
];

const initialSortBy = [
    {
        id: 'createDate',
        desc: true,
    },
];

const Container = styled.div`
    min-width: 430px;
`;

type RowProps = {
    data: {
        rows: Array<T>,
        prepareRow: (T) => void,
        accountNameParam: string,
    },
    index: number,
    style: Object,
};
// https://react-window.now.sh/#/examples/list/memoized-list-items
const Row = ({ data: { rows, prepareRow, accountNameParam, dispatch }, index, style }: RowProps) => {
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

// https://github.com/developit/preact-compat/blob/7c5de00e7c85e2ffd011bf3af02899b63f699d3a/src/index.js#L349
function shallowDiffers(prev: Object, next: Object): boolean {
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

// using React.memo to avoid unnecessary re-renders.
const MemoRow = memo(Row, (prevProps, nextProps) => {
    // console.log('prevProps.data.rows[0]!!!', prevProps.data.rows[0]);
    // console.log('nextProps.data.rows[0]!!!', nextProps.data.rows[0]);
    // return areEqual(prevProps, nextProps);
    // console.log('!shallowDiffers(prevProps.style, nextProps.style)!!!', !shallowDiffers(prevProps.style, nextProps.style));
    // console.log('prevProps.data.prepareRow === nextProps.data.prepareRow!!!', prevProps.data.prepareRow === nextProps.data.prepareRow);
    // console.log('prevProps.data.rows[0].id === nextProps.data.rows[0].id!!!', prevProps.data.rows[0].id === nextProps.data.rows[0].id);
    // console.log('prevProps.data.rows.length === nextProps.data.rows.length!!!', prevProps.data.rows.length === nextProps.data.rows.length);

    return !shallowDiffers(prevProps.style, nextProps.style)
        && prevProps.data.prepareRow === nextProps.data.prepareRow
        // should rerender when sorted
        && prevProps.data.rows[0].id === nextProps.data.rows[0].id
        // should rerender when add new account/ delete account or filter
        && prevProps.data.rows.length === nextProps.data.rows.length
        && prevProps.data.accountNameParam === nextProps.data.accountNameParam
        && prevProps.data.dispatch === nextProps.data.dispatch;
});
// const MemoRow = memo(Row, areEqual);

// createItemData: This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure MemoRow components.
// This is only needed since we are passing multiple props with a wrapper object.
const createItemData = memoize((rows, prepareRow, accountNameParam, dispatch) =>
    ({ rows, prepareRow, accountNameParam, dispatch }), isDeepEqual);

// const listRef = React.createRef();

function AccountList() {
    const dispatch = useDispatch();
    const { accountName: accountNameParam } = useParams();

    const listRef = useRef();

    // NOTE: accountList do not need to be memoized.
    // "accountList"'s reference changes when a new configuration is set.
    const accountList = useSelector((state: AppState) => state.configuration.latest.users);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        setFilter,
        prepareRow,
    } = useTable({
        columns,
        data: accountList,
        initialState: { sortBy: initialSortBy },
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy);

    useEffect(() => {
        // NOTE: display the first/newest account after the mount or when an account gets deleted (not on every render).
        if (!accountNameParam && rows.length > 0) {
            dispatch(push(`/accounts/${rows[0].original.userName}`));
        }
        // NOTE: Center align the item within the list.
        // if (listRef.current && accountNameParam && rows.length > 0) {
        //     console.log('useEffect => scrollToItem!!!');
        //     const index = rows.findIndex(r => r.values.userName === accountNameParam);
        //     // eslint-disable-next-line flowtype-errors/show-errors
        //     // listRef.current.scrollToItem(index, 'smart');
        // }
    }, [accountNameParam, dispatch, rows.length]);


    useEffect(() => {
        console.log('NEW listRef.current!!!!');
        if (accountNameParam && rows.length > 0) {
            console.log('scroll!!!');
            const index = rows.findIndex(r => r.values.userName === accountNameParam);
            listRef.current.scrollToItem(index, 'smart');
        }
    }, [listRef.current]);

    // NOTE: empty state component
    if (accountList.length === 0) {
        return <Warning iconClass="fas fa-5x fa-wallet" title='Let&apos;s start, create your first account.' btnTitle='Create Account' btnAction={() => dispatch(push('/createAccount'))} />;
    }

    return (
        <Container>
            <T.Search>
                <T.SearchInput placeholder='Filter by Name' onChange={e => setFilter('userName', e.target.value)}/>
                <T.ExtraButton text="Create Account" variant='info' onClick={() => dispatch(push('/createAccount'))} size="default" type="submit" />
            </T.Search>
            <T.Container>
                <Table {...getTableProps()}>
                    <T.Head>
                        {headerGroups.map(headerGroup => (
                            <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <T.HeadCell onClick={e => {
                                        e.persist();
                                        listRef.current.scrollToItem(0);
                                        column.toggleSortBy();
                                    }} key={column.id} {...column.getHeaderProps()} >
                                        {column.render('Header')}
                                        <Icon>
                                            {column.isSorted
                                                ? column.isSortedDesc
                                                    ? <i className='fas fa-sort-down' />
                                                    : <i className='fas fa-sort-up' />
                                                : <i className='fas fa-sort' />}
                                        </Icon>
                                    </T.HeadCell>
                                ))}
                            </T.HeadRow>
                        ))}
                    </T.Head>
                    <T.Body {...getTableBodyProps()}>
                        <FixedSizeList
                            ref={ref => listRef.current = ref}
                            height={500}
                            itemCount={rows.length}
                            itemSize={45}
                            width='100%'
                            itemData={createItemData(rows, prepareRow, accountNameParam, dispatch)}
                        >
                            {MemoRow}
                        </FixedSizeList>
                    </T.Body>
                </Table>
            </T.Container>
        </Container>
    );
}

export default AccountList;
