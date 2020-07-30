// @flow
import React, { useEffect } from 'react';
import Table, * as T from '../ui-elements/Table';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { Account } from '../../types/account';
import type { AppState } from '../../types/state';
import { displayAccount } from '../actions';
import { formatDate } from '../utils';
import { push } from 'connected-react-router';
import styled from 'styled-components';


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

function AccountList() {
    const dispatch = useDispatch();
    const accountNameSelected = useSelector((state: AppState) => state.account.display.userName);

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
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy);

    useEffect(() => {
        // NOTE: display the first/newest account after the mount or when an account gets deleted (not on every render).
        if (rows.length > 0) {
            dispatch(displayAccount(rows[0].original));
        } else {
            dispatch(displayAccount({}));
        }
    }, [rows.length]);

    const handleRowClick = (account: Account) => {
        if (account.userName !== accountNameSelected) {
            dispatch(displayAccount(account));
        }
    };

    const rowSelected = (accountName: string): boolean => {
        return accountName === accountNameSelected;
    };

    // NOTE: empty state component
    if (accountList.length === 0) {
        return <T.EmptyState header={<i className="fas fa-5x fa-wallet"></i>} title='Let&apos;s start, create your first account.' btnTitle='Create Account' btnAction={() => dispatch(push('/accounts/create'))} />;
    }

    return (
        <div id='account-list'>
            <T.Search>
                <T.SearchInput placeholder='Filter by Name' onChange={e => setFilter('userName', e.target.value)}/>
                <T.ExtraButton text="Create Account" variant='info' onClick={() => dispatch(push('/accounts/create'))} size="default" type="submit" />
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
                        {rows.map(row => {
                            prepareRow(row);
                            return (
                                <T.Row isSelected={rowSelected(row.values.userName)} onClick={() => handleRowClick(row.original)} key={row.id} {...row.getRowProps()}>
                                    {row.cells.map(cell => {
                                        return (
                                            <T.Cell key={cell.id} {...cell.getCellProps()} >
                                                {cell.render('Cell')}
                                            </T.Cell>
                                        );
                                    })}
                                </T.Row>
                            );
                        })}
                    </T.Body>
                </Table>
            </T.Container>
        </div>
    );
}

export default AccountList;
