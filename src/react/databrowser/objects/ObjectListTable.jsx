// @flow
import MemoRow, { createItemData } from './ObjectRow';
import React, { useCallback, useMemo, useState } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { continueListObjects, toggleAllObjects, toggleObject } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useFlexLayout, useSortBy, useTable } from 'react-table';
import type { AppState } from '../../../types/state';
import { AutoSizer } from 'react-virtualized';
import { Checkbox } from '../../ui-elements/FormLayout';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { List } from 'immutable';
import MiddleEllipsis from '../../ui-elements/MiddleEllipsis';
import type { ObjectEntity } from '../../../types/s3';
import { formatBytes } from '../../utils';
import { padding } from '@scality/core-ui/dist/style/theme';
import { push } from 'connected-react-router';
import styled from 'styled-components';

export const Icon = styled.i`
    margin-right: ${padding.smaller};
    margin-left: ${props => props.isMargin ? padding.base : '0px'};
`;

type CellProps = {
    row: {
        original: ObjectEntity,
    },
};

type Props = {
    objects: List<ObjectEntity>,
    bucketName: string,
    toggled: List<ObjectEntity>,
    isVersioningType: boolean,
    prefixWithSlash: string,
};
export default function ObjectListTable({ objects, bucketName, toggled, isVersioningType, prefixWithSlash }: Props){
    const [tableWidth, setTableWidth] = useState(0);
    const dispatch = useDispatch();
    const nextMarker = useSelector((state: AppState) => state.s3.listObjectsResults.nextMarker);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);
    const objectsLength = objects.size;
    const isToggledFull = toggled.size > 0 && toggled.size === objectsLength;

    const isItemLoaded = useCallback(index => {
        const shouldRefetch = !loading && nextMarker && index === objectsLength - 1;
        return !shouldRefetch;
    }, [nextMarker, objectsLength, loading]);

    const handleCellClicked = useCallback((bucketName, key) => (e) => {
        e.stopPropagation();
        dispatch(push(`/buckets/${bucketName}/objects/${key}`));
    }, [dispatch]);

    const columns = useMemo(() => [
        {
            id: 'checkbox',
            accessor: '',
            headerStyle: { display: 'flex' },
            Cell({ row: { original } }: CellProps) {
                return (
                    <div style={{ textOverflow: 'clip' }}>
                        <Checkbox
                            name="objectCheckbox"
                            checked={original.toggled}
                            onClick={(e) => e.stopPropagation() } // Prevent checkbox and clickable table row conflict.
                            onChange={() => dispatch(toggleObject(original.key, original.versionId)) }
                        />
                    </div>
                );
            },
            Header:
                <Checkbox
                    name="objectsHeaderCheckbox"
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
                    return <span>
                        <Icon className='far fa-folder'></Icon>
                        <T.CellClick onClick={handleCellClicked(bucketName, original.key)}>{original.name}</T.CellClick>
                    </span>;
                }
                if (original.isDeleteMarker) {
                    return <span> <Icon isMargin={!original.isLatest} className='fas fa-ban'></Icon>{original.name}</span>;
                }
                return <span>
                    <Icon isMargin={!original.isLatest} className='far fa-file'></Icon>
                    <T.CellA href={original.signedUrl} download={`${bucketName}-${original.key}`}>
                        {original.name}
                    </T.CellA>
                </span>;
            },
            width: isVersioningType ? 44 : 59,
        },
        {
            Header: 'Version ID',
            accessor: 'versionId',
            cellStyle: { overflow: 'visible' },
            Cell({ value: versionId }: { value: string }) {
                return <MiddleEllipsis width={tableWidth} text={versionId}/>;
            },
            width: 20,
        },
        {
            Header: 'Modified on',
            accessor: 'lastModified',
            width: 25,
        },
        {
            id: 'size',
            Header: 'Size',
            accessor: row => row.size ? formatBytes(row.size) : '',
            width: 15,
        },
    ], [bucketName, dispatch, handleCellClicked, isToggledFull, isVersioningType]);

    const hiddenColumns = isVersioningType ? [] : ['versionId'];

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
        initialState: { hiddenColumns },
    }, useFilters, useSortBy, useFlexLayout);

    // NOTE: Calculates the size of the scrollbar to apply margin
    // on the "Size" column so that it can be aligned to the right even if the scrollbar is displayed
    const refList = useCallback((ref) => {
        if (ref) {
            setTableWidth(parseInt(ref.props.width));
        }
    }, []);

    return <T.ContainerWithSubHeader>
        <Table {...getTableProps()}>
            <T.Head>
                {headerGroups.map(headerGroup => (
                    <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => {
                            const headerProps = column.getHeaderProps(column.getSortByToggleProps());
                            return (
                                <T.HeadCell id={`object-list-table-head-${column.id}`} key={column.id} {...headerProps} style={{ ...column.headerStyle, ...headerProps.style }}>
                                    {column.render('Header')}
                                    <T.Icon>
                                        {!column.disableSortBy && (column.isSorted
                                            ? column.isSortedDesc
                                                ? <i className='fas fa-sort-down' />
                                                : <i className='fas fa-sort-up' />
                                            : <i className='fas fa-sort' />)}
                                    </T.Icon>
                                </T.HeadCell>
                            );
                        })}
                    </T.HeadRow>
                ))}
            </T.Head>
            <T.BodyWindowing {...getTableBodyProps()}>
                <AutoSizer>
                    {({ height, width }) => (
                        // ISSUE: https://github.com/bvaughn/react-window/issues/504
                        // eslint-disable-next-line flowtype-errors/show-errors
                        <InfiniteLoader
                            isItemLoaded={ isItemLoaded }
                            itemCount={ rows.length }
                            loadMoreItems={ () =>
                                dispatch(continueListObjects(bucketName, prefixWithSlash))
                            }
                        >
                            { ({ onItemsRendered, ref }) => (
                                // eslint-disable-next-line flowtype-errors/show-errors
                                <FixedSizeList
                                    height={ height || 300 }
                                    itemCount={ rows.length }
                                    itemSize={ 45 }
                                    width={ width || '100%' }
                                    itemData={ createItemData(rows, prepareRow, dispatch) }
                                    onItemsRendered={ onItemsRendered }
                                    ref={ list => { refList(list); ref(list); } }
                                >
                                    { MemoRow }
                                </FixedSizeList>
                            )}
                        </InfiniteLoader>
                    )}
                </AutoSizer>
            </T.BodyWindowing>
        </Table>
    </T.ContainerWithSubHeader>;
}
