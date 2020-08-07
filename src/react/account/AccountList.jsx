// @flow
import React, { useCallback, useEffect, useRef } from 'react';
import Table, * as T from '../ui-elements/Table';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { Account } from '../../types/account';
import type { AppState } from '../../types/state';
import { FixedSizeList } from 'react-window';
import { Warning } from '../ui-elements/Warning';
import { formatDate } from '../utils';
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

function AccountList() {
    const dispatch = useDispatch();

    const listRef = useRef();

    // NOTE: accountList do not need to be memoized.
    // "accountList"'s reference changes when a new configuration is set.
    const accountList = useSelector((state: AppState) => state.configuration.latest.users);

    const { accountName: accountNameParams } = useParams();

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
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy);

    useEffect(() => {
        // NOTE: display the first/newest account after the mount or when an account gets deleted (not on every render).
        if (!accountNameParams && rows.length > 0) {
            dispatch(push(`/accounts/${rows[0].original.userName}`));
        }
        // NOTE: Center align the item within the list.
        if (listRef.current && accountNameParams && rows.length > 0) {
            const index = rows.findIndex(r => r.values.userName === accountNameParams);
            listRef.current.scrollToItem(index, 'smart');
        }
    }, [accountNameParams, dispatch, rows.length]);

    const handleRowClick = useCallback((account: Account) => {
        if (account.userName !== accountNameParams) {
            dispatch(push(`/accounts/${account.userName}`));
        }
    }, [accountNameParams, dispatch]);

    const rowSelected = useCallback((accountName: string): boolean => {
        return accountName === accountNameParams;
    }, [accountNameParams]);

    // https://codesandbox.io/s/github/tannerlinsley/react-table/tree/master/examples/virtualized-rows?file=/src/App.js:1057-1561
    const RenderRow = useCallback(({ index, style }) => {
        const row = rows[index];
        prepareRow(row);
        return (
            <T.Row isSelected={rowSelected(row.values.userName)} onClick={() => handleRowClick(row.original)} key={row.id} {...row.getRowProps({ style })}>
                {row.cells.map(cell => {
                    return (
                        <T.Cell key={cell.id} {...cell.getCellProps()} >
                            {cell.render('Cell')}
                        </T.Cell>
                    );
                })}
            </T.Row>
        );
    },[handleRowClick, prepareRow, rows, rowSelected]);


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
                                    <T.HeadCell key={column.id} {...column.getHeaderProps(column.getSortByToggleProps())} >
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
                            ref={listRef}
                            height={500}
                            itemCount={rows.length}
                            itemSize={45}
                            width='100%'
                        >
                            {RenderRow}
                        </FixedSizeList>
                    </T.Body>
                </Table>
            </T.Container>
        </Container>
    );
}

export default AccountList;
