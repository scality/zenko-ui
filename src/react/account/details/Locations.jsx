// @flow
import React, { useMemo } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { AppState } from '../../../types/state';
import { Button } from '@scality/core-ui';
import type { LocationName } from '../../../types/config';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const initialSortBy = [
    {
        id: 'name',
        desc: false,
    },
];

export const Icon = styled.i`
    margin-left: 5px;
`;

export const CustomBody = styled(T.Body)`
    height: calc(100vh - 400px);
`;

const Actions = styled.div`
    text-align: right;
`;

const ActionButton = styled(Button)`
    margin-left: 5px;
`;

const Container = styled.div`
    min-width: 430px;
`;

function Locations() {
    const dispatch = useDispatch();

    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const data = useMemo(() => Object.values(locations), [locations]);

    const columns = useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'name',
            },
            {
                Header: 'Type',
                accessor: 'locationType',
            },
            {
                id: 'actions',
                Header: '',
                accessor: 'name',
                disableSortBy: true,
                Cell({ value: locationName }: { value: LocationName}){
                    return <Actions>
                        <ActionButton icon={<i className="far fa-edit" />} onClick={() => dispatch(push(`/locations/${locationName}/edit`))} size="smaller" variant="info" text='' />
                        <ActionButton icon={<i className="fas fa-trash" />} onClick={() => {}} size="smaller" variant="danger" text='' />
                    </Actions>;
                },
            },
        ], [dispatch]);

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

    // NOTE: empty state component
    if (locations.length === 0) {
        return <Warning iconClass="fas fa-5x fa-wallet" title='Let&apos;s start, create your first storage location.' btnTitle='Create Location' btnAction={() => dispatch(push('/create-location'))} />;
    }

    return (
        <Container id='account-list'>
            <T.Search>
                <T.SearchInput placeholder='Filter by Name' onChange={e => setFilter('name', e.target.value)}/>
                <T.ExtraButton text="Create Location" icon={<i className="fas fa-plus" />} variant='info' onClick={() => dispatch(push('/create-location'))} size="default" type="submit" />
            </T.Search>
            <T.Container>
                <Table {...getTableProps()}>
                    <T.Head>
                        {headerGroups.map(headerGroup => (
                            <T.HeadRow key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <T.HeadCell key={column.id} {...column.getHeaderProps(column.getSortByToggleProps())} >
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
                        {rows.map(row => {
                            prepareRow(row);
                            return (
                                <T.Row isSelected={false} onClick={() => {}} key={row.id} {...row.getRowProps()}>
                                    {row.cells.map(cell => {
                                        return (
                                            <T.Cell key={cell.id} {...cell.getCellProps()} >
                                                {cell.render('Cell')}
                                            </T.Cell>
                                        );
                                    })}
                                </T.Row>
                            );
                        })}
                    </CustomBody>
                </Table>
            </T.Container>
        </Container>
    );
}

export default Locations;
