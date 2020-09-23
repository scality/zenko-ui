// @flow
import * as L from '../../ui-elements/ListLayout2';
import MemoRow, { createItemData } from './ObjectRow';
import type { Object, S3Object } from '../../../types/s3';
import React, { useMemo, useRef } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { openFolderCreateModal, openObjectUploadModal } from '../../actions';
import { useFilters, useFlexLayout, useSortBy, useTable } from 'react-table';
import { FixedSizeList } from 'react-window';
import { List } from 'immutable';
import { stripTrailingSlash } from '../../utils';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useHeight } from '../../utils/hooks';

export const CustomBody = styled(T.Body)`
    height: calc(100vh - 350px);
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
    objects: List<S3Object>,
    bucketNameParam: string,
    prefixParam: ?string,
};
export default function ObjectList({ objects, bucketNameParam, prefixParam }: Props){
    const dispatch = useDispatch();
    const listRef = useRef<FixedSizeList<T> | null>(null);

    const resizerRef = useRef<FixedSizeList<T> | null>(null);
    const height = useHeight(resizerRef);

    const columns = useMemo(() => [
        {
            Header: 'Name',
            accessor: 'name',
            Cell({ row: { original } }: CellProps) {
                if (original.isFolder) {
                    const name = stripTrailingSlash(original.name);
                    const newPrefix = prefixParam ? `${stripTrailingSlash(prefixParam)}/${name}` : name;
                    return <span> <Icon className='far fa-folder'></Icon> <T.CellLink to={{ pathname: `/buckets/${bucketNameParam}/objects/${newPrefix}` }}>{original.name}</T.CellLink></span>;
                }
                return <span> <Icon className='far fa-file'></Icon> { original.name } </span>;
            },
            width: 50,
        },
        {
            Header: 'Modified on',
            accessor: 'lastModified',
            width: 40,
        },
        {
            Header: 'Size',
            accessor: 'size',
            width: 10,
        },
    ], [bucketNameParam, prefixParam]);

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

    return <L.ListSection>
        <T.ButtonContainer>
            <T.ExtraButton icon={<i className="fas fa-upload" />} text="Upload" variant='info' onClick={() => dispatch(openObjectUploadModal())} size="default" type="submit" />
            <T.ExtraButton icon={<i className="fas fa-plus" />} text="Create Folder" variant='info' onClick={() => dispatch(openFolderCreateModal())} size="default" type="submit" />
        </T.ButtonContainer>
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
                                itemData={createItemData(rows, prepareRow)}
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
