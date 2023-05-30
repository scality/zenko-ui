import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Button } from '@scality/core-ui/dist/next';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { formatSimpleDate } from '../utils';
import { NameLinkContaner } from '../ui-elements/NameLink';
import { AppState } from '../../types/state';
import { Icon, Link } from '@scality/core-ui';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { useAccountLatestUsedCapacity } from '../next-architecture/domain/business/accounts';
import { Account } from '../next-architecture/domain/entities/account';
import { CellProps, CoreUIColumn } from 'react-table';
import { UsedCapacityInlinePromiseResult } from '../next-architecture/ui/metrics/LatestUsedCapacity';
import { useSetAssumedRole } from '../DataServiceRoleProvider';
import { useAuthGroups } from '../utils/hooks';

const TableAction = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${spacing.sp16};
`;

function AccountList({ accounts }: { accounts: Account[] }) {
  const dispatch = useDispatch();
  const userGroups = useSelector(
    (state: AppState) => state.oidc.user?.profile?.groups || [],
  );

  const { isStorageManager } = useAuthGroups();

  const nameCell = ({ value, row }: CellProps<Account, string>) => {
    const setRole = useSetAssumedRole();
    if (!row.original.canManageAccount) {
      return value;
    }

    return (
      <Link
        href="#"
        onClick={() => {
          setRole({ roleArn: row.original.preferredAssumableRoleArn });
          dispatch(push(`/accounts/${value}`));
        }}
      >
        {value}
      </Link>
    );
  };

  const createDateCell = ({ value }: CellProps<Account, string>) => {
    return <div>{formatSimpleDate(new Date(value))}</div>;
  };

  const columns: CoreUIColumn<Account>[] = React.useMemo(() => {
    return [
      {
        Header: 'Account Name',
        accessor: 'name',
        cellStyle: {
          minWidth: '20rem',
        },
        Cell: (value: CellProps<Account, string>) => nameCell(value),
      },
      {
        Header: 'Created On',
        accessor: 'creationDate',
        cellStyle: {
          textAlign: 'right',
          minWidth: '7rem',
        },
        Cell: (value: CellProps<Account, string>) => createDateCell(value),
      },
      isStorageManager
        ? {
            Header: 'Data Used',
            accessor: 'usedCapacity',
            cellStyle: {
              textAlign: 'right',
              minWidth: '7rem',
            },
            Cell: ({ row }) => {
              const metricsAdapter = useMetricsAdapter();

              const { usedCapacity } = useAccountLatestUsedCapacity({
                accountCanonicalId: row.original.canonicalId,
                metricsAdapter: metricsAdapter,
              });

              return <UsedCapacityInlinePromiseResult result={usedCapacity} />;
            },
          }
        : undefined,
    ].filter((e) => e);
  }, [nameCell]);

  return (
    <div
      style={{
        padding: `${spacing.sp16}`,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      <Table
        columns={columns}
        data={accounts}
        defaultSortingKey={'creationDate'}
      >
        <TableAction>
          <Table.SearchWithQueryParams
            displayedName={{
              singular: 'account',
              plural: 'accounts',
            }}
          />
          {userGroups.includes('StorageManager') ? (
            <Button
              icon={<Icon name="Create-add" />}
              label="Create Account"
              variant="primary"
              onClick={() => dispatch(push('/create-account'))}
              type="submit"
            ></Button>
          ) : (
            ''
          )}
        </TableAction>
        <Table.SingleSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel1"
          backgroundVariant="backgroundLevel3"
        />
      </Table>
    </div>
  );
}

export default AccountList;
