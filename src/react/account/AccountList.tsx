import { ConstrainedText, FormattedDateTime, Icon, Link, Stack } from '@scality/core-ui';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import React, { useMemo } from 'react';
import type { CellProps, CoreUIColumn } from 'react-table';

import { useCurrentAccount, useSetAssumedRole } from '../DataServiceRoleProvider';
import { StartISVConnectorButton } from '../ISV/components/StartISVConnectorButton';
import { useAccountLatestUsedCapacity } from '../next-architecture/domain/business/accounts';
import type { Account } from '../next-architecture/domain/entities/account';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
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

  const { isStorageManager } = useAuthGroups();
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
    const dataUsedColumn = getDataUsedColumn(
      (account: Account) => {
        const metricsAdapter = useMetricsAdapter();
        return useAccountLatestUsedCapacity({
          metricsAdapter,
          accountCanonicalId: account.canonicalId,
        });
      },
      { minWidth: '7rem' },
    );
    const additionalStorageManagerColumns = [{ ...dataUsedColumn, dropAt: 500 }];

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
        dropAt: 620,
        cellStyle: {
          textAlign: 'right',
          minWidth: '20ch',
        },
        Cell: ({ value }: CellProps<Account, Date>) => (
          <FormattedDateTime format="date-time-second" value={new Date(value)} />
        ),
      },
      ...(isStorageManager ? additionalStorageManagerColumns : []),
    ];
  }, [nameCell]);

  return (
    <Box container display="flex" flexDirection="column" flex="1">
      <Table
        columns={columns}
        data={accounts}
        defaultSortingKey={'creationDate'}
        revealDroppedColumns
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
    </Box>
  );
}

export default AccountList;
