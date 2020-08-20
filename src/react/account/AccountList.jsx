// @flow
import MemoRow, { createItemData } from './AccountRow';
import React, { useEffect, useRef } from 'react';
import Table, * as T from '../ui-elements/Table';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
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

export const CustomBody = styled(T.Body)`
    height: calc(100vh - 200px);
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

const handleSortClick = (column, listRef) => {
    if (listRef && listRef.current) {
        listRef.current.scrollToItem(0);
    }
    column.toggleSortBy();
};

function AccountList() {
    const dispatch = useDispatch();
    const { accountName: accountNameParam } = useParams();

    const listRef = useRef<FixedSizeList<T> | null>(null);

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
    }, [accountNameParam, dispatch, rows.length]);


    useEffect(() => {
        if (listRef && listRef.current && accountNameParam && rows.length > 0) {
            listRef.current.scrollToItem(
                rows.findIndex(r => r.values.userName === accountNameParam),
                'smart'
            );
        }
    }, [listRef]);

    // NOTE: empty state component
    if (accountList.length === 0) {
        return <Warning iconClass="fas fa-5x fa-wallet" title='Let&apos;s start, create your first account.' btnTitle='Create Account' btnAction={() => dispatch(push('/createAccount'))} />;
    }

    return (
        <Container id='account-list'>
            <T.Search>
                <T.SearchInput placeholder='Filter by Name' onChange={e => setFilter('userName', e.target.value)}/>
                <T.ExtraButton icon={<i className="fas fa-plus" />} text="Create Account" variant='info' onClick={() => dispatch(push('/createAccount'))} size="default" type="submit" />
            </T.Search>
            <T.Container>
                <Table {...getTableProps()}>
                    <T.Head>
                        {headerGroups.map(headerGroup => (
                            <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <T.HeadCell onClick={() => handleSortClick(column, listRef)} key={column.id} {...column.getHeaderProps()} >
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
                    <CustomBody {...getTableBodyProps()}>
                        {
                            // ISSUE: https://github.com/bvaughn/react-window/issues/504
                            // eslint-disable-next-line flowtype-errors/show-errors
                            <FixedSizeList
                                ref={listRef}
                                height={500}
                                itemCount={rows.length}
                                itemSize={45}
                                width='100%'
                                itemData={createItemData(rows, prepareRow, accountNameParam, dispatch)}
                            >
                                {MemoRow}
                            </FixedSizeList>
                        }
                    </CustomBody>
                </Table>
            </T.Container>
        </Container>
    );
}

export default AccountList;
