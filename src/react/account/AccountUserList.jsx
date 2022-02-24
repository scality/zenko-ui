//@flow
import React, { useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Table, Button } from '@scality/core-ui/dist/next';
import TextBadge from '@scality/core-ui/dist/components/textbadge/TextBadge.component';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { formatSimpleDate } from '../utils';
import { useIAMClient } from '../IAMProvider';
import { useInfiniteQuery } from 'react-query';
import { useAwsPaginatedEntities } from '../utils/IAMhooks';
import { TitleRow as TableHeader } from '../ui-elements/TableKeyValue';
import CopyARNButton from '../ui-elements/CopyARNButton';

const InlineButton = styled(Button)`
  height: ${spacing.sp24};
  margin-left: ${spacing.sp16};
`;

const AsyncRenderAccessKey = ({ userName }: { userName: string }) => {
  const IAMClient = useIAMClient();
  const history = useHistory();

  const {
    data: accessKeysResult,
    status: userAccessKeyStatus,
  } = useAwsPaginatedEntities(
    {
      queryKey: ['listIAMUserAccessKey', userName],
      queryFn: (_ctx, marker) => IAMClient.listAccessKeys(userName, marker),
      enabled: IAMClient !== null,
    },
    data => data.AccessKeyMetadata,
  );

  const accessKeys = useMemo(() => {
    if (userAccessKeyStatus === 'success') {
      return accessKeysResult.length;
    }
    return 0;
  }, [userAccessKeyStatus]);

  // display a hyphen if there is an error occurs
  return userAccessKeyStatus === 'error' ? null : (
    <div>
      {userAccessKeyStatus === 'loading' && 'loading...'}
      {userAccessKeyStatus === 'success' ? (
        accessKeys > 2 ? (
          <TextBadge variant={'statusWarning'} text={accessKeys}></TextBadge>
        ) : (
          accessKeys
        )
      ) : null}
      <InlineButton
        icon={<i className="fas fa-eye" />}
        variant="secondary"
        onClick={() => history.push(`users/${userName}/access-keys`)}
        type="button"
        tooltip={{
          overlayStyle: { width: '14rem' },
          overlay: 'Checking or creating access keys',
        }}
        disabled={userAccessKeyStatus === 'loading'}
      />
    </div>
  );
};

const renderAccessKeyComponent = ({ row }) => (
  <AsyncRenderAccessKey userName={row.original.userName} />
);

const renderActionButtons = rowValues => {
  const { arn } = rowValues;

  return <CopyARNButton text={arn} />;
};

const AccountUserList = () => {
  const { accountName } = useParams();
  const history = useHistory();
  const IAMClient = useIAMClient();

  const {
    data: listUsersResult,
    status: listUsersStatus,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['listIAMUsers', accountName],
    queryFn: ({ pageParam }) => {
      return IAMClient.listUsers(100, pageParam);
    },
    getNextPageParam: lastPage => lastPage.Marker,
    enabled: IAMClient !== null,
  });

  const iamUsers = useMemo(() => {
    if (listUsersStatus === 'success') {
      return listUsersResult.pages
        .flatMap(page => page.Users)
        .map(user => {
          return {
            userName: user.UserName,
            createdOn: formatSimpleDate(user.CreateDate),
            accessKeys: null,
            arn: user.Arn,
            actions: null,
          };
        });
    }
    return [];
  }, [listUsersStatus, listUsersResult]);

  const columns = [
    {
      Header: 'User Name',
      accessor: 'userName',
      cellStyle: {
        minWidth: '20rem',
      },
    },
    {
      Header: 'Access Keys',
      accessor: 'accessKeys',
      cellStyle: {
        textAlign: 'right',
      },
      Cell: renderAccessKeyComponent,
    },
    {
      Header: 'Created On',
      accessor: 'createdOn',
      cellStyle: {
        textAlign: 'right',
        minWidth: '7rem',
      },
    },
    // Table cell for all the actions (Copy ARN, Edit and Delete)
    {
      Header: '',
      accessor: 'actions',
      cellStyle: {
        textAlign: 'right',
        minWidth: '25rem',
      },
      disableSortBy: true,
      Cell: value => renderActionButtons(value.row.original),
    },
  ];

  return (
    <div style={{ height: '100%' }}>
      <Table
        columns={columns}
        data={iamUsers}
        defaultSortingKey={'userName'}
        onBottom={() => {
          if (hasNextPage && !isFetchingNextPage) {
            return fetchNextPage();
          }
        }}
      >
        <TableHeader>
          <Table.SearchWithQueryParams
            displayedName={{
              singular: 'user',
              plural: 'users',
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
          separationLineVariant="backgroundLevel1"
          backgroundVariant="backgroundLevel3"
          customItemKey={(index, iamUsers) => {
            return iamUsers[index].Arn;
          }}
        />
      </Table>
    </div>
  );
};

export default AccountUserList;
