// @flow
import { Banner, Tooltip } from '@scality/core-ui';
import { HideMe, TextAligner } from '../../../ui-elements/Utility';
import React, { useEffect, useMemo } from 'react';
import Table, * as T from '../../../ui-elements/Table';
import { deleteAccountAccessKey, listAccountAccessKeys, openAccountKeyCreateModal } from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useFlexLayout, useSortBy, useTable } from 'react-table';
import type { Account } from '../../../../types/account';
import type { AppState } from '../../../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import { Clipboard } from '../../../ui-elements/Clipboard';
import { Warning } from '../../../ui-elements/Warning';
import { formatShortDate } from '../../../utils';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

const TableContainer = styled.div`
    display: block;
    width: fit-content;
    margin-top: ${spacing.sp20};
`;

const EllipsisCell = styled.div`
  overflow: hidden;
  overflow-wrap: break-word;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
`;

const initialSortBy = [
    {
        id: 'created_at',
        desc: true,
    },
];

type Props = {
    account: Account,
};

function AccountKeys({ account }: Props) {
    const dispatch = useDispatch();
    const accessKeysInfo = useSelector((state: AppState) => state.account.accessKeyList);

    useEffect(() => {
        dispatch(listAccountAccessKeys(account.userName));
    }, [dispatch, account.userName]);

    const handleOpenKeyModal = () => {
        dispatch(openAccountKeyCreateModal());
    };

    const columns = useMemo(() => [
        {
            Header: 'Access key ID',
            accessor: 'access_key',
            Cell({ value: access_key }: { value: string }) {
                return <span style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <EllipsisCell>{ access_key }</EllipsisCell>
                    <div style={{ marginLeft: spacing.sp16 }}>
                        <Clipboard text={ access_key }/>
                    </div>
                </span>;
            },
        },
        {
            Header: 'Created On',
            accessor: 'created_at',
            headerStyle: { textAlign: 'right' },
            Cell({ value: created_at }: { value: Date }) {
                return <TextAligner alignment='right'>
                    {formatShortDate(new Date(created_at))}
                </TextAligner>;
            },
            width: 80,
        },
        {
            id: 'actions',
            Header: '',
            accessor: 'access_key',
            disableSortBy: true,
            Cell({ value: access_key }: { value: string }) {
                return (
                    <Button
                        disabled={false}
                        icon={<i className='fas fa-trash' />}
                        onClick={() => dispatch(deleteAccountAccessKey(account.userName, access_key))}
                        variant='danger'
                        tooltip={{ overlay: 'Remove Key', placement: 'right' }}
                    />
                );
            },
        },
    ], [dispatch, account.userName]);

    const accessKeys = useMemo(() => accessKeysInfo.map(accessKeyInfo => {
        return {
            access_key: accessKeyInfo.AccessKeyId,
            created_at: accessKeyInfo.CreateDate,
        };
    }), [accessKeysInfo]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({
        columns,
        data: accessKeys,
        initialState: { sortBy: initialSortBy },
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
    }, useFilters, useSortBy, useFlexLayout);

    return (
        <TableContainer>
            <h3>Root user Access keys details</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <HideMe isHidden={!accessKeys || accessKeys.length === 0}>
                    <Banner
                        variant='danger'
                        icon={<i className='fas fa-exclamation-triangle' />}
                    >
                        Security Status: Root user Access keys give unrestricted
                        access to account resources. It is a best practice to delete
                        root Access keys and use IAM user access keys instead.
                    </Banner>
                </HideMe>
                {/* TODO: use a styled component */}
                <Button variant="primary" style={{ marginLeft: spacing.sp16, whiteSpace: 'nowrap' }} icon={<i className="fas fa-plus" />} onClick={handleOpenKeyModal} label='Create Access key'/>
            </div>
            <T.Container>
                <Table { ...getTableProps() }>
                    <T.Head>
                        { headerGroups.map((headerGroup, index) => (
                            <T.HeadRow key={ index } { ...headerGroup.getHeaderGroupProps() }>
                                { headerGroup.headers.map(column => {
                                    const headerProps = column.getHeaderProps(column.getSortByToggleProps({ title: '' }));
                                    return (
                                        <T.HeadCell key={ column.id } { ...headerProps } style={{ ...column.headerStyle, ...headerProps.style }}>
                                            { column.render('Header') }
                                            <T.Icon>
                                                { !column.disableSortBy && (column.isSorted
                                                    ? column.isSortedDesc
                                                        ? <i className='fas fa-sort-down'/>
                                                        : <i className='fas fa-sort-up'/>
                                                    : <i className='fas fa-sort'/>) }
                                            </T.Icon>
                                        </T.HeadCell>
                                    );
                                }) }
                            </T.HeadRow>
                        )) }
                    </T.Head>
                    <T.Body { ...getTableBodyProps() }>
                        { rows.length > 0 ?
                            rows.map(row => {
                                prepareRow(row);
                                return (
                                    <T.Row isSelected={ false } key={ row.id } { ...row.getRowProps() }>
                                        { row.cells.map(cell => {
                                            const cellProps = cell.getCellProps();
                                            return <T.Cell key={cell.id} {...cellProps} style={{ ...cell.column.cellStyle, ...cellProps.style }}>
                                                { cell.render('Cell') }
                                            </T.Cell>;
                                        }) }
                                    </T.Row>
                                );
                            }) :
                            <Warning
                                centered={true}
                                iconClass='fas fa-exclamation-triangle'
                                title='No key created'
                            />
                        }
                    </T.Body>
                </Table>
            </T.Container>
        </TableContainer>
    );
}

export default AccountKeys;
