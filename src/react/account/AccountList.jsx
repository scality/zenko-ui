// @flow
import MemoRow, { createItemData } from './AccountRow';
import React, { useEffect, useRef } from 'react';
import Table, * as T from '../ui-elements/Table';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { Account } from '../../types/account';
import { AutoSizer } from 'react-virtualized';
import { FixedSizeList } from 'react-window';
import { ListSection } from '../ui-elements/ListLayout';
import { TextAligner } from '../ui-elements/Utility';
import { formatSimpleDate } from '../utils';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

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
        headerStyle: { textAlign: 'right' },
        Cell({ value: date }: { value: number }) {
            return <TextAligner alignment='right'>
                { formatSimpleDate(new Date(date)) }
            </TextAligner>;
        },
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
    }, [listRef, accountIndex]);

    return (
        <ListSection id='account-list'>
            <T.SearchContainer>
                <T.Search>
                    <T.SearchInput disableToggle={true} placeholder='Search by Account Name' onChange={e => setFilter('userName', e.target.value)} />
                </T.Search>
                <T.ExtraButton icon={<i className="fas fa-plus" />} text="Create Account" variant='buttonPrimary' onClick={() => dispatch(push('/create-account'))} size="default" type="submit" />
            </T.SearchContainer>
            <T.Container>
                <Table {...getTableProps()}>
                    <T.Head>
                        {headerGroups.map(headerGroup => (
                            <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <T.HeadCell onClick={() => handleSortClick(column, listRef)} key={column.id} {...column.getHeaderProps()} style={{ ...column.headerStyle }}>
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
                    <T.BodyWindowing {...getTableBodyProps()}>
                        <AutoSizer>
                            {({ height, width }) => (
                                // ISSUE: https://github.com/bvaughn/react-window/issues/504
                                // eslint-disable-next-line flowtype-errors/show-errors
                                <FixedSizeList
                                    ref={listRef}
                                    height={height || 300}
                                    itemCount={rows.length}
                                    itemSize={45}
                                    width={width || '100%'}
                                    itemData={createItemData(rows, prepareRow, accountNameParam, dispatch)}
                                >
                                    {MemoRow}
                                </FixedSizeList>
                            )}
                        </AutoSizer>
                    </T.BodyWindowing>
                </Table>
            </T.Container>
        </ListSection>
    );
}

export default AccountList;
