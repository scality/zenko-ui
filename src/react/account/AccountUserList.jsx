import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Table, Button } from '@scality/core-ui/dist/next';
import styled from 'styled-components';

import { formatSimpleDate } from '../utils';
import { useIAMClient } from '../IAMProvider';
import { useQuery } from 'react-query';

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccountUserList = () => {
  const [users, setUsers] = useState([]);

  const [usersData, setUsersData] = useState([]);
  const history = useHistory();
  const IAMClient = useIAMClient();

  useQuery({
    queryKey: ['listIAMClient'],
    queryFn: () => {
      return IAMClient.listUsers({
        // FIXME To improve
        MaxItems: 100,
      }).then(res => {
        setUsers(res.Users);
        setUsersData(res.Users);
      });
    },
    enabled: IAMClient !== null,
  });

  useQuery({
    queryKey: ['listAllIAMClientUserAccessKeys', users],
    queryFn: () => {
      return Promise.all(
        users.map(user => IAMClient.listAccessKeys(user.UserName)),
      ).then(res => {
        const userWithAccessKeys = res.map((accessKeys, idx) => {
          return {
            ...users[idx],
            accessKeys: accessKeys.AccessKeyMetadata,
          };
        });
        setUsersData(userWithAccessKeys);
      });
    },
    enabled: IAMClient !== null && users.length > 0,
  });

  const columns = useMemo(() => {
    return [
      {
        Header: 'User Name',
        accessor: 'userName',
      },
      {
        Header: 'Access Keys',
        accessor: 'accessKeys',
        Cell: cellValues => {
          return (
            <div>
              {cellValues.value}
              <Button
                icon={<i className="fas fa-eye" />}
                variant="primary"
                onClick={() =>
                  history.push(
                    `users/${cellValues.row.values.userName}/access-keys`,
                  )
                }
                type="button"
              />
            </div>
          );
        },
      },
      {
        Header: 'Created On',
        accessor: 'createdOn',
      },
    ];
  }, [history]);

  const data = useMemo(() => {
    return usersData.map(user => {
      const date = formatSimpleDate(user.CreateDate);
      return {
        userName: user.UserName,
        policies: '',
        groups: '',
        accessKeys: user?.accessKeys?.length ?? 0,
        lastActivity: '',
        createdOn: date,
        arn: user.Arn,
      };
    });
  }, [usersData]);

  return (
    <div style={{ height: '100%' }}>
      <Table columns={columns} data={data} defaultSortingKey={'userName'}>
        <TableHeader>
          <Table.SearchWithQueryParams
            displayedName={{
              singular: 'person',
              plural: 'persons',
            }}
          />
          <Button
            icon={<i className="fas fa-plus" />}
            label="Create User"
            variant="primary"
            onClick={() => history.push('create-user')}
            type="submit"
          />
        </TableHeader>
        <Table.SingleSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel3"
          backgroundVariant="backgroundLevel1"
        />
      </Table>
    </div>
  );
};

export default AccountUserList;
