import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { Button } from '@scality/core-ui/dist/next';
import TextBadge from '@scality/core-ui/dist/components/textbadge/TextBadge.component';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { formatSimpleDate } from '../utils';
import { useIAMClient } from '../IAMProvider';
import { useAwsPaginatedEntities } from '../utils/IAMhooks';
import CopyARNButton from '../ui-elements/CopyARNButton';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useMutation, useQuery } from 'react-query';
import { queryClient } from '../App';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { Banner } from '@scality/core-ui';
import {
  getUserListUsersQuery,
  getUserAccessKeysQuery,
  getUserListGroupsQuery,
} from '../queries';

import { User } from '../../types/user';
import { CellProps } from 'react-table';
import AwsPaginatedResourceTable from './AwsPaginatedResourceTable';
import IAMClient from '../../js/IAMClient';

const InlineButton = styled(Button)`
  height: ${spacing.sp24};
  margin-left: ${spacing.sp16};
`;

const AsyncRenderAccessKey = ({ userName }: { userName: string }) => {
  const IAMClient = useIAMClient();
  const history = useHistory();
  const { data: accessKeysResult, status: userAccessKeyStatus } =
    useAwsPaginatedEntities(
      getUserAccessKeysQuery(userName, notFalsyTypeGuard(IAMClient)),
      (data) => data.AccessKeyMetadata,
    );
  const accessKeys = useMemo(() => {
    if (userAccessKeyStatus === 'success') {
      return notFalsyTypeGuard(accessKeysResult).length;
    }

    return 0;
  }, [userAccessKeyStatus]);
  return userAccessKeyStatus === 'error' ? null : (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {userAccessKeyStatus === 'loading' && (
        <SpacedBox
          mr={12}
          style={{
            marginLeft: 'auto',
          }}
        >
          loading...
        </SpacedBox>
      )}
      {userAccessKeyStatus === 'success' ? (
        <SpacedBox
          mr={12}
          style={{
            marginLeft: 'auto',
          }}
        >
          {accessKeys > 2 ? (
            <TextBadge variant={'statusWarning'} text={accessKeys}></TextBadge>
          ) : (
            accessKeys
          )}
        </SpacedBox>
      ) : null}
      <InlineButton
        icon={<i className="fas fa-eye" />}
        variant="secondary"
        onClick={() => history.push(`users/${userName}/access-keys`)}
        type="button"
        tooltip={{
          overlayStyle: {
            width: '14rem',
          },
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

const RenderEditButton = ({ userName }: { userName: string }) => {
  const history = useHistory();
  return (
    <SpacedBox ml={12}>
      <Button
        style={{ height: spacing.sp24 }}
        variant="secondary"
        label="Edit"
        icon={<i className="fa fa-pen"></i>}
        onClick={() => history.push(`users/${userName}/update-user`)}
      />
    </SpacedBox>
  );
};

const renderActionButtons = (rowValues) => {
  const { arn, userName } = rowValues;
  return (
    <div style={{ display: 'flex' }}>
      <CopyARNButton text={arn} />
      <RenderEditButton userName={userName} />
    </div>
  );
};


const AccountUserList = ({ accountName }: { accountName?: string }) => {
  const history = useHistory();
  const getQuery = (IAMClient: IAMClient) => getUserListUsersQuery(notFalsyTypeGuard(accountName), IAMClient);
  const getEntitiesFromResult = (page) => page.Users;

  const prepareData = (queryResult, search) => {
    if (queryResult.firstPageStatus === 'success') {
      const iamUsers = queryResult && queryResult.data && queryResult.data.map((user) => {
        return {
          userName: user.UserName,
          createdOn: formatSimpleDate(user.CreateDate),
          accessKeys: null,
          arn: user.Arn,
          actions: null,
        };
      });

      if (search) {
        return iamUsers.filter((user) =>
          user.userName.toLowerCase().startsWith(search.toLowerCase()),
        );
      }

      return iamUsers;
    }

    return [];
  };
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
        minWidth: '10rem',
      },
      Cell: renderAccessKeyComponent,
    },
    {
      Header: 'Created On',
      accessor: 'createdOn',
      cellStyle: {
        textAlign: 'right',
        minWidth: '7rem',
        marginRight: 'auto',
      },
    }, // Table cell for all the actions (Copy ARN, Edit and Delete)
    {
      Header: '',
      accessor: 'actions',
      cellStyle: {
        textAlign: 'right',
        marginRight: 'auto',
        marginLeft: '26rem',
        minWidth: '5rem',
      },
      disableSortBy: true,
      Cell: (value: CellProps<User>) => renderActionButtons(value.row.original),
    },
  ];
  return (
    <AwsPaginatedResourceTable
      columns={columns}
      additionalHeaders={<Button
        icon={<i className="fas fa-plus" />}
        label="Create User"
        variant="primary"
        onClick={() => history.push('create-user')}
        type="submit"
      />}
      defaultSortingKey={'userName'}
      getItemKey={(index, iamUsers) => {
        return iamUsers[index].Arn;
      }}
      query={{
        getResourceQuery: getQuery,
        getEntitiesFromResult,
        prepareData
      }}
      labels={{
        singularResourceName: 'user',
        pluralResourceName: 'users',
        loading: 'Loading users...',
        disabledSearchWhileLoading: 'Search is disabled while loading users',
        errorPreviousHeaders: 'An error occured, users listing may be incomplete. Please retry' +
          ' and if the error persist contact your support.',
        errorInTableContent: 'We failed to retrieve users, please retry later. If the error persists, please contact your support.',
      }}
    />
  );
};

export default AccountUserList;