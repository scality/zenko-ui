import {
  ConstrainedText,
  Icon,
  Link,
  Stack,
  FormattedDateTime,
} from '@scality/core-ui';
import { Button, Table } from '@scality/core-ui/dist/next';
import React, { useMemo } from 'react';
import { CellProps, CoreUIColumn } from 'react-table';
import { Account } from '../next-architecture/domain/entities/account';

import {
  useCurrentAccount,
  useSetAssumedRole,
} from '../DataServiceRoleProvider';
import { useAccountLatestUsedCapacity } from '../next-architecture/domain/business/accounts';

import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';
import { TableHeaderWrapper } from '../ui-elements/Table';
import { useAuthGroups } from '../utils/hooks';
import { useBasenameRelativeNavigate } from '@scality/module-federation';

function useAutoAssumeRoleUponAccountDeletion({
  accounts,
}: {
  accounts: Account[];
}) {
  const { account } = useCurrentAccount();
  const setRole = useSetAssumedRole();
  useMemo(() => {
    if (account === undefined) {
      setRole({ roleArn: accounts[0].preferredAssumableRoleArn });
    }
  }, [account]);
}

function AccountList({
  accounts,
  setIsISVModalOpen,
}: {
  accounts: Account[];

  setIsISVModalOpen: (value: boolean) => void;
}) {
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
            onClick={() => {
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
    const additionalStorageManagerColumns = [dataUsedColumn];

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
        Cell: ({ value }: CellProps<Account, Date>) => (
          <FormattedDateTime
            format="date-time-second"
            value={new Date(value)}
          />
        ),
      },
      ...(isStorageManager ? additionalStorageManagerColumns : []),
    ];
  }, [nameCell]);

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
                <Button
                  label="Start ISV Connector"
                  variant="secondary"
                  onClick={() => setIsISVModalOpen(true)}
                  type="button"
                />

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
        <Table.SingleSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel1"
        />
      </Table>
    </div>
  );
}

export default AccountList;
