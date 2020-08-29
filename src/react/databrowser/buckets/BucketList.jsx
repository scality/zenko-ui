// @flow

import { FixedSizeList } from 'react-window';
import MemoRow, { createItemData } from './BucketRow';
import * as L from '../../ui-elements/ListLayout2';
import React, { useCallback, useEffect, useRef } from 'react';
import Table, * as T from '../../ui-elements/Table';

import { useFilters, useSortBy, useTable } from 'react-table';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

const Icon = styled.i`
  margin-left: 5px;
`;

export const CustomBody = styled(T.Body)`
    height: calc(100vh - 320px);
`;

const initialSortBy = [
    {
        id: 'Name',
        desc: false,
    },
];

const columns = [
    {
        Header: 'Bucket Name',
        accessor: 'Name',
    },
];
export default function BucketList(){
    const dispatch = useDispatch();
    const data = useSelector((state: AppState) => state.s3.listBucketsResults.list);
    const listRef = useRef<FixedSizeList<T> | null>(null);

    // console.log('coco!!!', coco);
    console.log('data!!!', data);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        setFilter,
        prepareRow,
    } = useTable({
        columns,
        data,
        initialState: { sortBy: initialSortBy },
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy);

    return <L.Container>
        <L.Head>

            <L.HeadSlice>
              yess
            </L.HeadSlice>

        </L.Head>

        <L.Body>
            <L.ListSection>
                <T.SearchContainer>
                    <T.Search> <T.SearchInput placeholder='Filter by Bucket Name' onChange={e => setFilter('Name', e.target.value)}/> </T.Search>
                </T.SearchContainer>
                <T.Container>
                    <Table {...getTableProps()}>
                        <T.Head>
                            {headerGroups.map(headerGroup => (
                                <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        <T.HeadCell key={column.id} {...column.getHeaderProps(column.getSortByToggleProps({ title: '' }))} >
                                            {column.render('Header')}
                                            <Icon>
                                                {!column.disableSortBy && (column.isSorted
                                                    ? column.isSortedDesc
                                                        ? <i className='fas fa-sort-down' />
                                                        : <i className='fas fa-sort-up' />
                                                    : <i className='fas fa-sort' />)}
                                            </Icon>
                                        </T.HeadCell>
                                    ))}
                                </T.HeadRow>
                            ))}
                        </T.Head>
                        <CustomBody {...getTableBodyProps()}>
                            {
                                <FixedSizeList
                                    ref={listRef}
                                    height={500}
                                    itemCount={rows.length}
                                    itemSize={45}
                                    width='100%'
                                    itemData={createItemData(rows, prepareRow, dispatch)}
                                >
                                    {MemoRow}
                                </FixedSizeList>
                            }
                            {
                            // rows.map(row => {
                            //     prepareRow(row);
                            //     return (
                            //         <T.Row isSelected={false} key={row.id} {...row.getRowProps()}>
                            //             {row.cells.map(cell => {
                            //                 return (
                            //                     <T.Cell key={cell.id} {...cell.getCellProps()} >
                            //                         {cell.render('Cell')}
                            //                     </T.Cell>
                            //                 );
                            //             })}
                            //         </T.Row>
                            //     );
                            // })
                            }
                        </CustomBody>
                    </Table>
                </T.Container>
            </L.ListSection>
            <L.ContentSection>

              22222
            </L.ContentSection>
        </L.Body>

    </L.Container>;
}
