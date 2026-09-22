import { ConstrainedText, FormattedDateTime, Icon, Link, Stack, spacing } from '@scality/core-ui';
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
import { TOOLBAR_ACTION_ICON_ONLY_BELOW } from '../ui-elements/responsive';
import { TableHeaderWrapper } from '../ui-elements/Table';
import { useAuthGroups } from '../utils/hooks';

/* The table gives its cells no right gutter of their own, so whichever column comes last
   sits on the panel border. Which one that is varies — `Data Used` shows only to a storage
   manager, and `Created On` drops at a narrow container — so every right-aligned column
   carries the gutter. */
const ROW_RIGHT_GUTTER = spacing.r16;

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
      { minWidth: '7rem', paddingRight: ROW_RIGHT_GUTTER },
    );

    return [
      {
        Header: 'Account Name',
        accessor: 'name',
        cellStyle: {
          /* The table lays its columns out in blocks, so a column that states no `flex`
             keeps the 150px default width and the row stops short of its own right edge.
             The name is the column with something to say, so it takes the slack. Its
             floor is what it needs to stay readable: the name is a `ConstrainedText`
             clamped to two lines, so past the floor it ellipsises rather than overflows. */
          flex: 1,
          minWidth: '10rem',
        },
        Cell: (value: CellProps<Account, string>) => nameCell(value),
      },
      {
        Header: 'Created On',
        accessor: 'creationDate',
        dropAt: 620,
        cellStyle: {
          // Fits the 19 characters of `date-time-second`. Not `ch`: the table applies one
          // cellStyle to both the header and the body cells, and the header row is bold, so
          // a `ch` floor resolves ~12px wider there than in the cells and the two rows stop
          // agreeing on the column's width.
          minWidth: '10rem',
          textAlign: 'right',
          paddingRight: ROW_RIGHT_GUTTER,
        },
        Cell: ({ value }: CellProps<Account, Date>) => (
          <FormattedDateTime format="date-time-second" value={new Date(value)} />
        ),
      },
      ...(isStorageManager ? [dataUsedColumn] : []),
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
                  iconOnly={TOOLBAR_ACTION_ICON_ONLY_BELOW}
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
