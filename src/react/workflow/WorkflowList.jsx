// @flow
import MemoRow, { createItemData } from './WorkflowRow';
import Table, * as T from '../ui-elements/Table';
import { useFilters, useFlexLayout, useSortBy, useTable } from 'react-table';
import { AutoSizer } from 'react-virtualized';
import { FixedSizeList } from 'react-window';
import { ListSection } from '../ui-elements/ListLayout3';
import React from 'react';
import { TextTransformer } from '../ui-elements/Utility';
import type { Workflows } from '../../types/workflow';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';

const columns = [
    {
        Header: 'Workflow Description',
        accessor: 'name',
        width: 60,
    },
    {
        Header: 'Workflow Type',
        accessor: 'type',
        Cell({ value: type }: { value: string }) { return <TextTransformer transform='capitalize'>{type}</TextTransformer>; },
        width: 25,
    },
    {
        Header: 'State',
        accessor: 'state',
        Cell: ({ value }) => { return value ? 'Active' : 'Inactive'; },
        width: 15,
    },
];

type Props = {
    workflows: Workflows,
    workflowId: ?string,
    createMode: boolean,
};
function WorkflowList({ createMode, workflows, workflowId }: Props) {
    const dispatch = useDispatch();

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        setFilter,
        prepareRow,
    } = useTable({
        columns,
        data: workflows,
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy, useFlexLayout);

    return (
        <ListSection disabled={createMode} id='account-list'>
            <T.SearchContainer>
                <T.Search>
                    <T.SearchInput disableToggle={true} placeholder='Search by Workflow Name' onChange={e => setFilter('name', e.target.value)} />
                </T.Search>
                <T.ExtraButton icon={<i className="fas fa-plus" />} label="Create Workflow" variant='primary' onClick={() => dispatch(push('/create-workflow'))} type="submit" />
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
                                    height={height || 300}
                                    itemCount={rows.length}
                                    itemSize={45}
                                    width={width || '100%'}
                                    itemData={createItemData(rows, prepareRow, workflowId, dispatch)}
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

export default WorkflowList;
