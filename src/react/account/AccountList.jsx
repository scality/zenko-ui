// @flow
import MemoRow, { createItemData } from './AccountRow';
import React, { useEffect, useRef } from 'react';
import Table, * as T from '../ui-elements/Table';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { Account } from '../../types/account';
import { FixedSizeList } from 'react-window';
import { formatDate } from '../utils';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

export const CustomBody = styled(T.Body)`
    height: calc(100vh - 200px);
`;

const Container = styled.div`
    min-width: 430px;
`;

const handleSortClick = (column, listRef) => {
    if (listRef && listRef.current) {
        listRef.current.scrollToItem(0);
    }
    column.toggleSortBy();
};

const columns = [
    {
        Header: 'Account Name',
        accessor: 'userName',
    },
    {
        Header: 'Created on',
        accessor: 'createDate',
        Cell: ({ value }) => { return formatDate(new Date(value));},
    },
];

type Props = {
    accountList: Array<Account>,
    accountIndex: number,
};
function AccountList({ accountList, accountIndex }: Props) {
    const dispatch = useDispatch();
    const { accountName: accountNameParam } = useParams();
    const listRef = useRef<FixedSizeList<T> | null>(null);

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
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy);

    useEffect(() => {
        if (listRef && listRef.current && accountIndex > -1) {
            listRef.current.scrollToItem(accountIndex, 'smart');
        }
    }, [listRef]);

    return (
        <Container id='account-list'>
            <T.SearchContainer>
                <T.Search>
                    <T.SearchInput placeholder='Filter by Account Name' onChange={e => setFilter('userName', e.target.value)} />
                </T.Search>
                <T.ExtraButton icon={<i className="fas fa-plus" />} text="Create Account" variant='info' onClick={() => dispatch(push('/create-account'))} size="default" type="submit" />
            </T.SearchContainer>
            <T.Container>
                <Table {...getTableProps()}>
                    <T.Head>
                        {headerGroups.map(headerGroup => (
                            <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <T.HeadCell onClick={() => handleSortClick(column, listRef)} key={column.id} {...column.getHeaderProps()} >
                                        {column.render('Header')}
                                        <T.Icon>
                                            {column.isSorted
                                                ? column.isSortedDesc
                                                    ? <i className='fas fa-sort-down' />
                                                    : <i className='fas fa-sort-up' />
                                                : <i className='fas fa-sort' />}
                                        </T.Icon>
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
