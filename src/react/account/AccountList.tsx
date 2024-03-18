import {
  ConstrainedText,
  Icon,
  Link,
  Stack,
  FormattedDateTime,
} from '@scality/core-ui';
import { Button, Table } from '@scality/core-ui/dist/next';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { CellProps, CoreUIColumn } from 'react-table';
import { Account } from '../next-architecture/domain/entities/account';

import { VEEAM_FEATURE } from '../../js/config';
import {
  useCurrentAccount,
  useSetAssumedRole,
} from '../DataServiceRoleProvider';
import { useAccountLatestUsedCapacity } from '../next-architecture/domain/business/accounts';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';
import { TableHeaderWrapper } from '../ui-elements/Table';
import { useAuthGroups } from '../utils/hooks';

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

function AccountList({ accounts }: { accounts: Account[] }) {
  const history = useHistory();
  const { features } = useConfig();
  const { isStorageManager } = useAuthGroups();
  useAutoAssumeRoleUponAccountDeletion({ accounts });

  const nameCell = ({ value, row }: CellProps<Account, string>) => {
    const history = useHistory();
    const setRole = useSetAssumedRole();
    if (!row.original.canManageAccount) {
      return value;
    }

    return (
      <ConstrainedText
        text={
          <Link
            href="#"
            onClick={() => {
              setRole({ roleArn: row.original.preferredAssumableRoleArn });
              history.push(`/accounts/${value}`);
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
        Cell: ({ value }: CellProps<Account, string>) => (
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
                {features.includes(VEEAM_FEATURE) && (
                  <Button
                    label="Start Configuration for Veeam"
                    variant="secondary"
                    onClick={() => history.push('/veeam/configuration')}
                    type="button"
                  />
                )}
                <Button
                  icon={<Icon name="Create-add" />}
                  label="Create Account"
                  variant="primary"
                  onClick={() => history.push('/create-account')}
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
