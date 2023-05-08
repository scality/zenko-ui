import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Button } from '@scality/core-ui/dist/next';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { formatSimpleDate } from '../utils';
import { NameLinkContaner } from '../ui-elements/NameLink';
import { AppState } from '../../types/state';
import { setRoleArnStored } from '../utils/localStorage';
import { Icon } from '@scality/core-ui';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { useAccessibleAccountsAdapter } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { useAccountLatestUsedCapacity } from '../next-architecture/domain/business/accounts';
import { Account } from '../next-architecture/domain/entities/account';
import { CellProps, CoreUIColumn } from 'react-table';
import { UsedCapacityInlinePromiseResult } from '../next-architecture/ui/metrics/LatestUsedCapacity';

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

  const nameCell = ({ value, row }: CellProps<Account, string>) => {
    return (
      <NameLinkContaner
        onClick={() => {
          setRoleArnStored(row.original.preferredAssumableRoleArn);
          dispatch(push(`/accounts/${value}`));
        }}
      >
        {value}
      </NameLinkContaner>
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
      {
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
      },
    ];
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
