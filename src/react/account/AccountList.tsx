import React from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Button } from '@scality/core-ui/dist/next';
import Table from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import type { Account } from '../../types/account';
import { formatSimpleDate } from '../utils';
import { NameLinkContaner } from '../ui-elements/NameLink';

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

  const nameCell = ({ value }) => {
    return (
      <NameLinkContaner onClick={() => dispatch(push(`/accounts/${value}`))}>
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
      <Table columns={columns} data={accounts} defaultSortingKey={'CreationDate'}>
        <TableAction>
          <Table.SearchWithQueryParams
            displayedName={{
              singular: 'account',
              plural: 'accounts',
            }}
          />
          <Button
            icon={<i className="fas fa-plus" />}
            label="Create Account"
            variant="primary"
            onClick={() => dispatch(push('/create-account'))}
            type="submit"
          ></Button>
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
