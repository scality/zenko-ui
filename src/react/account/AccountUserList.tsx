import React, { ChangeEvent, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { Table, Button } from '@scality/core-ui/dist/next';
import TextBadge from '@scality/core-ui/dist/components/textbadge/TextBadge.component';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { formatSimpleDate } from '../utils';
import { useIAMClient } from '../IAMProvider';
import { useAwsPaginatedEntities } from '../utils/IAMhooks';
import { TitleRow as TableHeader } from '../ui-elements/TableKeyValue';
import CopyARNButton from '../ui-elements/CopyARNButton';
import { useQueryParams } from '../utils/hooks';
import SearchInputComponent from '@scality/core-ui/dist/components/searchinput/SearchInput.component';
import { Tooltip } from '@scality/core-ui';
import SpacedBox from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
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
import user from '../reducers/user';
const InlineButton = styled(Button)`
  height: ${spacing.sp24};
  margin-left: ${spacing.sp16};
`;

const AsyncRenderAccessKey = ({ userName }: { userName: string }) => {
  const IAMClient = useIAMClient();
  const history = useHistory();
  const {data: accessKeysResult, status: userAccessKeyStatus} = useAwsPaginatedEntities(getUserAccessKeysQuery(userName, notFalsyTypeGuard(IAMClient)), data => data.AccessKeyMetadata);
  const accessKeys = useMemo(() => {
    if (userAccessKeyStatus === 'success') {
      return notFalsyTypeGuard(accessKeysResult).length;
    }

    return 0;
  }, [userAccessKeyStatus]);
  // display a hyphen if there is an error occurs
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
        variant='secondary'
        label='Edit'
        icon={<i className='fa fa-pen'></i>}
        onClick={() => history.push(`users/${userName}/update-user`)}
      />
    </SpacedBox>);
};

const renderActionButtons = (rowValues) => {
  const { arn, userName } = rowValues;
  return (
    <div style={{ display: 'flex' }}>
      <CopyARNButton text={arn} />
      <RenderEditButton userName={userName} />
      <DeleteUserAction userName={userName} />
    </div>
  );
};

const WithTooltipWhileLoading = ({
  children,
  isLoading,
  tooltipOverlay,
}: {
  tooltipOverlay: string;
  isLoading?: boolean;
  children: JSX.Element;
}) => (
  <>
    {isLoading ? (
      <Tooltip overlay={tooltipOverlay}>{children}</Tooltip>
    ) : (
      children
    )}
  </>
);

const DeleteUserAction = (rowValue: { userName : string} , accountName: string) => {
  const { userName } = rowValue;
  const IAMClient = useIAMClient();
  const [showModal, setShowModal] = useState(false);
  const { data: accessKeysResult, status: accessKeyStatus } = useAwsPaginatedEntities(getUserAccessKeysQuery(userName, notFalsyTypeGuard(IAMClient)), data => data.AccessKeyMetadata);
  const { data: listGroupsResult, status: listGroupStatus } = useQuery(getUserListGroupsQuery(userName, notFalsyTypeGuard(IAMClient)));

  const deleteUserMutation = useMutation(
    (userName: string) => {
      return notFalsyTypeGuard(IAMClient).deleteUser(userName);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(getUserListUsersQuery(accountName, notFalsyTypeGuard(IAMClient)).queryKey),
    },
  );

  return (
    <>
      <DeleteConfirmation
        show={showModal}
        cancel={() => setShowModal(false)}
        approve={() => {
          deleteUserMutation.mutate(userName);
        }}
        titleText={`Permanently remove the following user ${userName} ?`}
      />

      <Button
        id='delete-accessKey-btn'
        disabled={(accessKeysResult && accessKeysResult?.length >= 1) || (listGroupsResult && listGroupsResult.Groups?.length >= 1) || accessKeyStatus === 'loading' || listGroupStatus === 'loading'}
        icon={<i className='fas fa-trash' />}
        style={{ height: spacing.sp24, marginLeft: '0.6rem' }}
        label='Delete'
        onClick={() => {
          setShowModal(true);
        }}
        variant='danger'
        tooltip={{ overlay: accessKeyStatus === 'loading' ? 'loading...':'Remove accessKey', placement: 'right' }}
      />
      {accessKeyStatus === 'error' &&  <Banner
        icon={<i className="fas fa-exclamation-triangle" />}
        title="Error: Unable to delete user"
        variant="danger"
      >
        Error: Unable to delete user.
      </Banner>}
    </>
  );
};

const SEARCH_QUERY_PARAM = 'search';

const AccountUserList = ({ accountName }: { accountName?: string }) => {
  const history = useHistory();
  const IAMClient = useIAMClient();
  const queryParams = useQueryParams();
  const match = useRouteMatch();
  const search = queryParams.get(SEARCH_QUERY_PARAM);

  const setSearch = (newSearch: string) => {
    queryParams.set(SEARCH_QUERY_PARAM, newSearch);
    history.replace(`${match.url}?${queryParams.toString()}`);
  };

  const listUsersQuery = useAwsPaginatedEntities(getUserListUsersQuery(accountName, IAMClient), (page) => page.Users);
  const iamUsers = useMemo(() => {
    if (listUsersQuery.firstPageStatus === 'success') {
      const iamUsers = listUsersQuery && listUsersQuery.data && listUsersQuery.data.map((user) => {
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
  }, [listUsersQuery.firstPageStatus, listUsersQuery.data, search]);
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
      Cell: (value) => renderActionButtons(value.row.original),
    },
  ];
  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <Table columns={columns} data={iamUsers} defaultSortingKey={'userName'}>
        <TableHeader>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {listUsersQuery.firstPageStatus !== 'loading' &&
            listUsersQuery.firstPageStatus !== 'error' ? (
              iamUsers && <SpacedBox mr={12}>
                Total {iamUsers.length} {iamUsers.length > 1 ? 'users' : 'user'}
              </SpacedBox>
            ) : (
              ''
            )}
            <WithTooltipWhileLoading
              isLoading={listUsersQuery.status === 'loading'}
              tooltipOverlay="Search is disabled while loading users"
            >
              <SearchInputComponent
                disabled={listUsersQuery.status !== 'success'}
                value={search}
                placeholder={'Search'}
                disableToggle
                onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                  setSearch(evt.target.value);
                }}
              />
            </WithTooltipWhileLoading>
            {listUsersQuery.firstPageStatus === 'loading' ? (
              <SpacedBox ml={12}>Loading users...</SpacedBox>
            ) : (
              ''
            )}
            {listUsersQuery.status === 'error' ? (
              <SpacedBox ml={12}>
                An error occured, users listing may be incomplete. Please retry
                and if the error persist contact your support.
              </SpacedBox>
            ) : (
              ''
            )}
          </div>
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
        >
          {(Rows) => (
            <>
              {listUsersQuery.firstPageStatus === 'loading' ||
              listUsersQuery.firstPageStatus === 'idle'
                ? 'Loading users...'
                : ''}
              {listUsersQuery.firstPageStatus === 'error'
                ? 'We failed to retrieve users, please retry later. If the error persists, please contact your support.'
                : ''}
              {listUsersQuery.firstPageStatus === 'success' ? <Rows /> : ''}
            </>
          )}
        </Table.SingleSelectableContent>
      </Table>
    </div>
  );
};

export default AccountUserList;
