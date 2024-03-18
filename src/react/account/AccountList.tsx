import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { formatSimpleDate } from '../utils';
import { ConstrainedText, Icon, Link, Stack } from '@scality/core-ui';
import { Account } from '../next-architecture/domain/entities/account';
import { CellProps, CoreUIColumn } from 'react-table';
import {
  useCurrentAccount,
  useSetAssumedRole,
} from '../DataServiceRoleProvider';
import { useAuthGroups } from '../utils/hooks';
import { getDataUsedColumn } from '../next-architecture/ui/metrics/DataUsedColumn';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { useAccountLatestUsedCapacity } from '../next-architecture/domain/business/accounts';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { VEEAM_FEATURE } from '../../js/config';

const TableAction = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${spacing.sp16};
`;

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

  const createDateCell = ({ value }: CellProps<Account, string>) => {
    return <div>{formatSimpleDate(new Date(value))}</div>;
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
        Cell: (value: CellProps<Account, string>) => createDateCell(value),
      },
      ...(isStorageManager ? additionalStorageManagerColumns : []),
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
          {isStorageManager ? (
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
