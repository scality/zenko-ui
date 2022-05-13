import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Button } from '@scality/core-ui/dist/next';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import type { Account } from '../../types/account';
import { formatSimpleDate } from '../utils';
import { NameLinkContaner } from '../ui-elements/NameLink';
import { AppState } from '../../types/state';
import {
  STORAGE_ACCOUNT_OWNER_ROLE,
  STORAGE_MANAGER_ROLE,
} from '../utils/hooks';
import { setRoleArnStored } from '../utils/localStorage';

const TableAction = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${spacing.sp16};
`;
type Props = {
  accounts: Array<Account>;
};

function AccountList({ accounts }: Props) {
  const dispatch = useDispatch();
  const userGroups = useSelector(
    (state: AppState) => state.oidc.user?.profile?.groups || [],
  );

  const nameCell = ({ value }) => {
    const selectedAccount = accounts.find((account) => account.Name === value);
    // preferable to assume the `Storage Account Owner` Role then `Storage Manager` Role
    const assumeRoleArn = useMemo(() => {
      const roleStorageAccountOwner = selectedAccount?.Roles.find(
        (role) => role.Name === STORAGE_ACCOUNT_OWNER_ROLE,
      );
      const roleStorageManager = selectedAccount?.Roles.find(
        (role) => role.Name === STORAGE_MANAGER_ROLE,
      );
      if (roleStorageAccountOwner) {
        return roleStorageAccountOwner.Arn;
      } else if (roleStorageManager) {
        return roleStorageManager.Arn;
      }
      return selectedAccount?.Roles[0].Arn;
    }, []);
    return (
      <NameLinkContaner
        onClick={() => {
          setRoleArnStored(assumeRoleArn);
          dispatch(push(`/accounts/${value}`));
        }}
      >
        {value}
      </NameLinkContaner>
    );
  };

  const createDateCell = ({ value }) => {
    return <div>{formatSimpleDate(new Date(value))}</div>;
  };

  const columns = React.useMemo(() => {
    return [
      {
        Header: 'Account Name',
        accessor: 'Name',
        cellStyle: {
          minWidth: '20rem',
        },
        Cell: (value) => nameCell(value),
      },
      {
        Header: 'Created on',
        accessor: 'CreationDate',
        cellStyle: {
          textAlign: 'right',
          minWidth: '7rem',
        },
        Cell: (value) => createDateCell(value),
      },
    ];
  }, [nameCell]);
  return (
    <div
      style={{
        padding: `${spacing.sp16}`,
        height: '100%',
      }}
    >
      <Table
        columns={columns}
        data={accounts}
        defaultSortingKey={'CreationDate'}
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
              icon={<i className="fas fa-plus" />}
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
