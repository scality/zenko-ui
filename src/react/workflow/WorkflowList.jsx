// @flow
import { Healthselector, Toggle } from '@scality/core-ui';
import MemoRow, { createItemData } from './WorkflowRow';
import React, { useEffect, useState } from 'react';
import Table, * as T from '../ui-elements/Table';
import { TextAligner, TextTransformer } from '../ui-elements/Utility';
import { useFilters, useFlexLayout, useSortBy, useTable } from 'react-table';
import { AutoSizer } from 'react-virtualized';
import { FixedSizeList } from 'react-window';
import { ListSection } from '../ui-elements/ListLayout3';
import { Select } from '@scality/core-ui/dist/next';
import type { Workflows } from '../../types/workflow';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { maybePluralize } from '../utils';
import { push } from 'connected-react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { workflowSelectOptions } from './workflowEditorUtils';

const Circle = styled.div`
    height: ${spacing.sp20};
    width: ${spacing.sp20};
    background-color: ${props => props.theme.brand[props.color]};
    border-radius: 50%;
    display: inline-block;
`;

const columns = [
    {
        Header: 'Health',
        accessor: 'health',
        Cell({ value: health }: { value: string }) {
            let color = 'statusHealthy';
            switch (health) {
            case 'ok': color = 'statusHealthy'; break;
            case 'warning': color = 'statusWarning'; break;
            default:
            case 'critical': color = 'statusCritical'; break;
            }
            return <TextAligner alignment='center'><Circle color={ color }/></TextAligner>;
        },
        headerStyle: { textAlign: 'center' },
        disableSortBy: true,
        width: 7,
    },
    {
        Header: 'Rule Name',
        accessor: 'name',
        width: 18,
        cellStyle: { whiteSpace: 'normal' },
    },
    {
        Header: 'Workflow',
        accessor: 'type',
        Cell({ value: type }: { value: string }) {
            const opt = workflowSelectOptions.find(opt => opt.value === type);
            return <div>
                <span style={{ marginRight: spacing.sp4 }}>{opt ? opt.icon : 'X'}</span>
                <span><TextTransformer transform='capitalize'>{type}</TextTransformer></span>
            </div>;
        },
        width: 20,
        cellStyle: { whiteSpace: 'normal' },
    },
    {
        Header: 'Storage Location',
        accessor: '',
        width: 20,
        cellStyle: { whiteSpace: 'normal' },
    },
    {
        Header: 'Bucket Name',
        accessor: 'bucketName',
        Cell({ value: bucketName }: { value: string }) { return <TextTransformer transform='capitalize'>{bucketName}</TextTransformer>; },
        width: 25,
        cellStyle: { whiteSpace: 'normal' },
    },
    {
        Header: 'State',
        accessor: 'state',
        filter: 'equals',
        Cell({ value: toggled }: { value: string }) { return <Toggle onChange={() => console.log('change')} toggle={ toggled || false }/>; },
        width: 10,
    },
];

type Props = {
    workflows: Workflows,
    workflowId: ?string,
    createMode: boolean,
};
function WorkflowList({ createMode, workflows, workflowId }: Props) {
    const dispatch = useDispatch();
    const stateSelectOptions: Array<{ label: string, value: boolean | 'all' }> = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: true },
        { label: 'Inactive', value: false },
    ];
    const [stateFilter, setStateFilter] = useState(stateSelectOptions[0].value);
    const [healthFilter, setHealthFilter] = useState<'all' | 'ok' | 'critical' | 'warning'>('all');

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

    useEffect(() => {
        setFilter('state', stateFilter === 'all' ? null : stateFilter);
    }, [setFilter, stateFilter]);

    useEffect(() => {
        setFilter('health', healthFilter === 'all' ? null : healthFilter);
    }, [setFilter, healthFilter]);

    return (
        <ListSection disabled={createMode} id='account-list'>
            <T.WorkflowHeader>
                <div>Total: {maybePluralize(workflows.length, 'rule')}</div>
                <T.Search>
                    <T.SearchInput disableToggle={true} placeholder='Search...' onChange={e => setFilter('name', e.target.value)} />
                </T.Search>
                <Healthselector items={[
                    { label: 'All', selected: healthFilter === 'all', onClick: () => setHealthFilter('all') },
                    { label: 'Ok', selected: healthFilter === 'ok', onClick: () => setHealthFilter('ok') },
                    { label: 'Warning', selected: healthFilter === 'warning', onClick: () => setHealthFilter('warning') },
                    { label: 'Critical', selected: healthFilter === 'critical', onClick: () => setHealthFilter('critical') },
                ]}/>
                <Select
                    id="state-select"
                    name="state"
                    value={stateFilter}
                    onChange={ (value) => setStateFilter(value) }
                >
                    {stateSelectOptions.map((opt, i) => <Select.Option key={i} value={opt.value}>{opt.label}</Select.Option>)}
                </Select>
                <T.WorkflowHeaderEnd>
                    <T.ExtraButton icon={<i className="fas fa-plus" />} label="Create Workflow" variant='primary' onClick={() => dispatch(push('/create-workflow'))} type="submit" />
                </T.WorkflowHeaderEnd>
            </T.WorkflowHeader>
            <T.Container>
                <Table {...getTableProps()}>
                    <T.Head>
                        {headerGroups.map(headerGroup => (
                            <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => {
                                    const headerProps = column.getHeaderProps(column.getSortByToggleProps({ title: '' }));
                                    return <T.HeadCell key={column.id} {...headerProps} style={{ ...column.headerStyle, ...headerProps.style }}>
                                        { column.render('Header') }
                                        <T.Icon>
                                            { !column.disableSortBy && (column.isSorted
                                                ? column.isSortedDesc
                                                    ? <i className='fas fa-sort-down'/>
                                                    : <i className='fas fa-sort-up'/>
                                                : <i className='fas fa-sort'/>) }
                                        </T.Icon>
                                    </T.HeadCell>;
                                })}
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
                                    itemSize={convertRemToPixels(parseFloat(spacing.sp40)) || 45}
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
