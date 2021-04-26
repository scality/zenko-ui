// @flow
import { Banner, Button, Tooltip } from '@scality/core-ui';
import React, { useEffect, useMemo } from 'react';
import Table, * as T from '../../../ui-elements/Table';
import { deleteAccessKey, listAccessKeys } from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useSortBy, useTable } from 'react-table';
import type { Account } from '../../../../types/account';
import type { AppState } from '../../../../types/state';
import { Clipboard } from '../../../ui-elements/Clipboard';
import { Warning } from '../../../ui-elements/Warning';
import { formatDate } from '../../../utils';
import { padding } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

type Props = {
    account: Account,
};

const TableContainer = styled.div`
    display: block;
    width: fit-content;
    margin-top: ${padding.large};
`;

const EllipsisCell = styled.a`
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

function AccountKeys({ account }: Props) {
    const dispatch = useDispatch();
    const accessKeysInfo = useSelector((state: AppState) => state.user.accessKeyList);

    useEffect(() => {
        // dispatch(listAccessKeys(account.userName));
    }, [account.userName, dispatch]);

    const columns = useMemo(() => [
        {
            Header: 'Access Key',
            accessor: 'access_key',
            Cell({ value: access_key }: { value: string }) {
                return <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <EllipsisCell title={access_key}>{access_key}</EllipsisCell>
                    <Clipboard text={access_key}/>
                </span>;
            },
        },
        {
            Header: 'Created On',
            accessor: 'created_at',
            Cell({ value: created_at }: { value: Date }) { return formatDate(new Date(created_at)); },
        },
        {
            Header: 'Last Used',
            accessor: 'last_used',
            Cell({ value: last_used }: { value: Date }) { return formatDate(new Date(last_used)); },
        },
        {
            id: 'actions',
            Header: '',
            accessor: 'access_key',
            disableSortBy: true,
            Cell({ value: access_key }: { value: string }){
                return (
                    <T.Actions>
                        <Tooltip overlay="Remove Key" placement="left">
                            <T.ActionButton
                                title="Remove Key"
                                disabled={false}
                                icon={<i className="fas fa-trash" />}
                                onClick={() => dispatch(deleteAccessKey(access_key, account.userName))}
                                size="smaller"
                                variant="danger"
                                text=''
                            />
                        </Tooltip>
                    </T.Actions>
                );
            },
        },
    ], [account.userName, dispatch]);

    const accessKeys = useMemo(() => accessKeysInfo.map(accessKeyInfo => {
        return {
            access_key: accessKeyInfo.AccessKeyId,
            created_at: accessKeyInfo.CreateDate,
            last_used: accessKeyInfo.LastUsed,
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
    }, useFilters, useSortBy);

    const displaySecurityStatus = accessKeys && accessKeys.length >= 1;

    return (
        <TableContainer>
            <h3>Root user Access Key & Secret Keys details</h3>
            <div style={{ display: 'flex', justifyContent: displaySecurityStatus ? 'space-between' : 'flex-end' }}>
                { displaySecurityStatus &&
                    <Banner
                        variant="danger"
                        icon={<i className="fas fa-exclamation-triangle" />}
                    >
                        Security Status: delete your Access keys (as a best practice, create an IAM user with access keys).
                    </Banner>
                }
                <Button
                    icon={<i className="fas fa-plus" />}
                    text="Create Access Key"
                    variant='secondary'
                    size="default"
                    type="button"
                />
            </div>
            <T.Container>
                <Table { ...getTableProps() }>
                    <T.Head>
                        { headerGroups.map((headerGroup, index) => (
                            <T.HeadRow key={ index } { ...headerGroup.getHeaderGroupProps() }>
                                { headerGroup.headers.map(column => (
                                    <T.HeadCell key={ column.id } { ...column.getHeaderProps(column.getSortByToggleProps({ title: '' })) }>
                                        { column.render('Header') }
                                        <T.Icon>
                                            { !column.disableSortBy && (column.isSorted
                                                ? column.isSortedDesc
                                                    ? <i className='fas fa-sort-down'/>
                                                    : <i className='fas fa-sort-up'/>
                                                : <i className='fas fa-sort'/>) }
                                        </T.Icon>
                                    </T.HeadCell>
                                )) }
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
                                            return (
                                                <T.Cell key={ cell.id } { ...cell.getCellProps() } >
                                                    { cell.render('Cell') }
                                                </T.Cell>
                                            );
                                        }) }
                                    </T.Row>
                                );
                            }) :
                            <Warning
                                centered={true}
                                iconClass="fas fa-exclamation-triangle"
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
