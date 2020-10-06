// @flow
import * as L from '../../ui-elements/ListLayout2';
import type { LocationName, Locations } from '../../../types/config';
import MemoRow, { createItemData } from './BucketRow';
import React, { useMemo, useRef } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { useFilters, useSortBy, useTable } from 'react-table';
import { FixedSizeList } from 'react-window';
import { List } from 'immutable';
import type { S3Bucket } from '../../../types/s3';
import { formatDate } from '../../utils';
import { getLocationTypeFromName } from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useHeight } from '../../utils/hooks';

export const CustomBody = styled(T.Body)`
    height: calc(100vh - 350px);
`;

type Props = {
    locations: Locations,
    buckets: List<S3Bucket>,
    selectedBucketName: ?string,
};
export default function BucketList({ selectedBucketName, buckets, locations }: Props){
    const dispatch = useDispatch();
    const listRef = useRef<FixedSizeList<T> | null>(null);

    const resizerRef = useRef<FixedSizeList<T> | null>(null);
    const height = useHeight(resizerRef);

    const columns = useMemo(() => [
        {
            Header: 'Bucket Name',
            accessor: 'Name',
            Cell({ value: name }: { value: string }) {
                return <T.CellLink to={{ pathname: `/buckets/${name}/objects` }}>{name}</T.CellLink>;
            },
        },
        {
            Header: 'Storage Location',
            accessor: 'LocationConstraint',
            Cell({ value: locationName }: { value: LocationName }) {
                const locationType = getLocationTypeFromName(locationName, locations);
                return `${locationName || 'us-east-1'} / ${locationType}`;
            },
        },
        {
            Header: 'Created on',
            accessor: 'CreationDate',
            Cell: ({ value }) => { return formatDate(new Date(value));},
        },
    ], [locations]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        setFilter,
        prepareRow,
    } = useTable({
        columns,
        data: buckets,
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy);

    return <L.ListSection>
        <T.SearchContainer>
            <T.Search> <T.SearchInput placeholder='Filter by Bucket Name' onChange={e => setFilter('Name', e.target.value)}/> </T.Search>
            <T.ExtraButton icon={<i className="fas fa-plus" />} text="Create Bucket" variant='info' onClick={() => dispatch(push('/create-bucket'))} size="default" type="submit" />
        </T.SearchContainer>
        <T.Container>
            <Table {...getTableProps()}>
                <T.Head>
                    {headerGroups.map(headerGroup => (
                        <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <T.HeadCell key={column.id} {...column.getHeaderProps(column.getSortByToggleProps({ title: '' }))} >
                                    {column.render('Header')}
                                    <T.Icon>
                                        {!column.disableSortBy && (column.isSorted
                                            ? column.isSortedDesc
                                                ? <i className='fas fa-sort-down' />
                                                : <i className='fas fa-sort-up' />
                                            : <i className='fas fa-sort' />)}
                                    </T.Icon>
                                </T.HeadCell>
                            ))}
                        </T.HeadRow>
                    ))}
                </T.Head>
                <CustomBody {...getTableBodyProps()}>
                    <T.Resizer ref={resizerRef}>
                        {
                            // ISSUE: https://github.com/bvaughn/react-window/issues/504
                            // eslint-disable-next-line flowtype-errors/show-errors
                            <FixedSizeList
                                ref={listRef}
                                height={height}
                                itemCount={rows.length}
                                itemSize={45}
                                width='100%'
                                itemData={createItemData(rows, prepareRow, selectedBucketName, dispatch)}
                            >
                                {MemoRow}
                            </FixedSizeList>
                        }
                    </T.Resizer>
                </CustomBody>
            </Table>
        </T.Container>
    </L.ListSection>;
}
