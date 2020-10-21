// @flow
import MemoRow, { createItemData } from './ObjectRow';
import React, { useMemo, useRef } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { formatBytes, stripTrailingSlash } from '../../utils';
import { toggleAllObjects, toggleObject } from '../../actions';
import { useFilters, useFlexLayout, useSortBy, useTable } from 'react-table';
import { FixedSizeList } from 'react-window';
import { List } from 'immutable';
import type { Object } from '../../../types/s3';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useHeight } from '../../utils/hooks';

export const CustomBody = styled(T.Body)`
    height: calc(100vh - 400px);
`;

export const Icon = styled.i`
    margin-right: 5px;
`;

type CellProps = {
    row: {
        original: Object,
    },
};

type Props = {
    objects: List<Object>,
    bucketName: string,
    prefixWithSlash: string,
    toggled: List<Object>,
};
export default function ObjectListTable({ objects, bucketName, prefixWithSlash, toggled }: Props){
    const dispatch = useDispatch();
    const listRef = useRef<FixedSizeList<T> | null>(null);

    const resizerRef = useRef<FixedSizeList<T> | null>(null);
    const height = useHeight(resizerRef);

    const isToggledFull = toggled.size > 0 && toggled.size === objects.size;

    const columns = useMemo(() => [
        {
            id: 'checkbox',
            accessor: '',
            Cell({ row: { original } }: CellProps) {
                return (
                    <input
                        type="checkbox"
                        className="checkbox"
                        checked={original.toggled}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent checkbox and clickable table row conflict.
                            dispatch(toggleObject(original.name));
                        }}
                    />
                );
            },
            Header: <input
                type="checkbox"
                className="checkbox"
                checked={isToggledFull}
                onChange={() => dispatch(toggleAllObjects(!isToggledFull))}
            />,
            disableSortBy: true,
            width: 1,
        },
        {
            Header: 'Name',
            accessor: 'name',
            Cell({ row: { original } }: CellProps) {
                if (original.isFolder) {
                    // const name = stripTrailingSlash(original.name);
                    return <span> <Icon className='far fa-folder'></Icon> <T.CellLink to={{ pathname: `/buckets/${bucketName}/objects/${original.key}` }}>{original.name}</T.CellLink></span>;
                }
                return <span> <Icon className='far fa-file'></Icon> <T.CellA href={original.signedUrl} download={`${bucketName}-${original.key}`}> {original.name} </T.CellA> </span>;
            },
            width: 49,
        },
        {
            Header: 'Modified on',
            accessor: 'lastModified',
            width: 35,
        },
        {
            id: 'size',
            Header: 'Size',
            accessor: row => row.size ? formatBytes(row.size) : '',
            width: 15,
        },
    ], [bucketName, prefixWithSlash, dispatch, isToggledFull]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({
        columns,
        data: objects,
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy, useFlexLayout);

    return <T.Container>
        <Table {...getTableProps()}>
            <T.Head>
                {headerGroups.map(headerGroup => (
                    <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <T.HeadCell id={`object-list-table-head-${column.id}`} key={column.id} {...column.getHeaderProps(column.getSortByToggleProps({ title: '' }))} >
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
                            itemData={createItemData(rows, prepareRow, dispatch)}
                        >
                            {MemoRow}
                        </FixedSizeList>
                    }
                </T.Resizer>
            </CustomBody>
        </Table>
    </T.Container>;
}
