import { ConstrainedText, FormattedDateTime, Icon, Link, Stack } from '@scality/core-ui';
import { Button, Table } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import React, { useMemo } from 'react';
import type { CellProps, CoreUIColumn } from 'react-table';

import { useCurrentAccount, useSetAssumedRole } from '../DataServiceRoleProvider';
import { StartISVConnectorButton } from '../ISV/components/StartISVConnectorButton';
import type { Account } from '../next-architecture/domain/entities/account';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';
import { TableHeaderWrapper } from '../ui-elements/Table';
import { useAuthGroups } from '../utils/hooks';

function useAutoAssumeRoleUponAccountDeletion({ accounts }: { accounts: Account[] }) {
  const { account } = useCurrentAccount();
  const setRole = useSetAssumedRole();
  useMemo(() => {
    if (account === undefined) {
      setRole({ roleArn: accounts[0].preferredAssumableRoleArn });
    }
  }, [account]);
}

function AccountList({ accounts }: { accounts: Account[] }) {
  const navigate = useBasenameRelativeNavigate();

  const { isStorageManager, isStorageUsageReporter } = useAuthGroups();
  useAutoAssumeRoleUponAccountDeletion({ accounts });
  const nameCell = ({ value, row }: CellProps<Account, string>) => {
    const navigate = useBasenameRelativeNavigate();
    const setRole = useSetAssumedRole();
    if (!row.original.canManageAccount) {
      return <>{value}</>;
    }

    return (
      <ConstrainedText
        text={
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setRole({ roleArn: row.original.preferredAssumableRoleArn });
              navigate(`/accounts/${value}`);
            }}
          >
            {value}
          </Link>
        }
        lineClamp={2}
      />
    );
  };

  const columns: CoreUIColumn<Account>[] = React.useMemo(() => {
    const dataUsedColumn = getDataUsedColumn((account: Account) => account, { minWidth: '7rem' });
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
          minWidth: '20ch',
        },
        Cell: ({ value }: CellProps<Account, Date>) => (
          <FormattedDateTime format="date-time-second" value={new Date(value)} />
        ),
      },
      ...(isStorageManager || isStorageUsageReporter ? [dataUsedColumn] : []),
    ];
  }, [nameCell, isStorageManager, isStorageUsageReporter]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      <Table
        columns={columns}
        data={accounts}
        defaultSortingKey={'creationDate'}
        entityName={{
          en: {
            singular: 'account',
            plural: 'accounts',
          },
        }}
      >
        <TableHeaderWrapper
          search={<Table.SearchWithQueryParams />}
          actions={
            isStorageManager && (
              <Stack>
                <StartISVConnectorButton />

                <Button
                  icon={<Icon name="Create-add" />}
                  label="Create Account"
                  variant="primary"
                  onClick={() => navigate('/create-account')}
                  type="submit"
                ></Button>
              </Stack>
            )
          }
        />
        <Table.SingleSelectableContent rowHeight="h40" separationLineVariant="backgroundLevel1" />
      </Table>
    </div>
  );
}

export default AccountList;
