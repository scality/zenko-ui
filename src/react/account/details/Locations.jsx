// @flow
import { Button, Tooltip } from '@scality/core-ui';
import type { LocationName, LocationType, Locations as LocationsType } from '../../../types/config';
import React, { useMemo } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { AppState } from '../../../types/state';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { storageOptions } from '../../backend/location/LocationDetails/storageOptions';
import styled from 'styled-components';

const canEditLocation = (locationName: LocationName, locations: LocationsType): boolean => {
    const isBuiltin = locations[locationName] && locations[locationName].isBuiltin;
    return !isBuiltin;
};

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
    height: calc(100vh - 420px);
`;

export const Actions = styled.div`
    text-align: right;
`;

export const ActionButton = styled(Button)`
    margin-left: 5px;
`;

const Container = styled.div`
    min-width: 430px;
`;

const IconTooltip = styled.i`
    margin-left: 5px;
`;

const Overlay = styled.div`
    width: 220px;
    padding: 10px;
    text-align: left;
`;

const CustomHeader = () => <span>
    Target Bucket
    <Tooltip overlay={<Overlay> Name of the bucket/container created in the specific location (e.g. RING, Azure, AWS S3, GCP...), and where the Zenko buckets attached to that location will store data. </Overlay>} placement="right">
        <IconTooltip className='far fa-question-circle'></IconTooltip >
    </Tooltip>
</span>;

function Locations() {
    const dispatch = useDispatch();

    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const data = useMemo(() => Object.values(locations), [locations]);

    const columns = useMemo(
        () => [
            {
                Header: 'Location Name',
                accessor: 'name',
            },
            {
                Header: 'Location Type',
                accessor: 'locationType',
                Cell({ value: locationType }: { value: LocationType }) {
                    return storageOptions[locationType]?.name || 'N/A' ;
                },
            },
            {
                Header: CustomHeader,
                accessor: 'details.bucketName',
            },
            {
                id: 'actions',
                Header: '',
                accessor: 'name',
                disableSortBy: true,
                Cell({ value: locationName }: { value: LocationName}){
                    return <Actions>
                        <ActionButton disabled={!canEditLocation(locationName, locations)} icon={<i className="far fa-edit" />} onClick={() => dispatch(push(`/locations/${locationName}/edit`))} size="smaller" variant="info" text='' />
                        <ActionButton disabled={true} icon={<i className="fas fa-trash" />} onClick={() => {}} size="smaller" variant="danger" text='' />
                    </Actions>;
                },
            },
        ], [dispatch, locations]);

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
        return <Warning iconClass="fas fa-5x fa-map-marker-alt" title='Create your first storage location.' btnTitle='Create Location' btnAction={() => dispatch(push('/create-location'))} />;
    }

    return (
        <Container id='location-list'>
            <T.SearchContainer>
                <T.Search> <T.SearchInput placeholder='Filter by Location Name' onChange={e => setFilter('name', e.target.value)}/> </T.Search>
                <T.ExtraButton text="Create Location" icon={<i className="fas fa-plus" />} variant='info' onClick={() => dispatch(push('/create-location'))} size="default" type="submit" />
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
                        {rows.map(row => {
                            prepareRow(row);
                            return (
                                <T.Row isSelected={false} key={row.id} {...row.getRowProps()}>
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
