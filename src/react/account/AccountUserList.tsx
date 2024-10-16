import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Button, CopyButton } from '@scality/core-ui/dist/next';
import { TextBadge } from '@scality/core-ui/dist/components/textbadge/TextBadge.component';
import { useIAMClient } from '../IAMProvider';
import {
  AWS_PAGINATED_ENTITIES,
  useAwsPaginatedEntities,
} from '../utils/IAMhooks';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useMutation, useQueryClient } from 'react-query';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import {
  getListAttachedUserPoliciesQuery,
  getListUsersQuery,
  getUserAccessKeysQuery,
  getUserListGroupsQuery,
} from '../queries';
import { CellProps } from 'react-table';
import AwsPaginatedResourceTable from './AwsPaginatedResourceTable';
import IAMClient from '../../js/IAMClient';
import { useDispatch } from 'react-redux';
import { handleApiError, handleClientError } from '../actions';
import { ApiError } from '../../types/actions';
import { User } from 'aws-sdk/clients/iam';
import { FormattedDateTime, Icon, spacing } from '@scality/core-ui';
import { Row } from 'react-table';

type InternalUser = {
  userName: string;
  createdOn: Date;
  accessKeys: string | null;
  arn: string;
  actions: null;
};

const AsyncRenderAccessKey = ({ userName }: { userName: string }) => {
  const IAMClient = useIAMClient();
  const history = useHistory();
  const { data: accessKeysResult, status: userAccessKeyStatus } =
    useAwsPaginatedEntities(
      getUserAccessKeysQuery(userName, IAMClient),
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
        <Box
          mr={12}
          style={{
            marginLeft: 'auto',
          }}
        >
          loading...
        </Box>
      )}
      {userAccessKeyStatus === 'success' ? (
        <Box
          mr={12}
          style={{
            marginLeft: 'auto',
          }}
        >
          {accessKeys > 2 ? (
            //@ts-expect-error fix this when you are working on it
            <TextBadge variant={'statusWarning'} text={accessKeys}></TextBadge>
          ) : (
            accessKeys
          )}
        </Box>
      ) : null}
      <Button
        size="inline"
        icon={<Icon name="Eye" color="textSecondary" />}
        variant="secondary"
        onClick={() => history.push(`users/${userName}/access-keys`)}
        type="button"
        tooltip={{ overlay: 'Checking or creating access keys' }}
        disabled={userAccessKeyStatus === 'loading'}
      />
    </div>
  );
};

const renderAccessKeyComponent = ({ row }) => (
  <AsyncRenderAccessKey userName={row.original.userName} />
);

const EditButton = ({ userName }: { userName: string }) => {
  const history = useHistory();
  return (
    <Button
      size="inline"
      variant="secondary"
      label="Edit"
      icon={<Icon name="Pen" color="textSecondary" />}
      onClick={() => history.push(`users/${userName}/update-user`)}
    />
  );
};

const AttachButton = ({
  userName,
  accountName,
}: {
  userName: string;
  accountName: string;
}) => {
  const history = useHistory();
  return (
    <Button
      size="inline"
      variant="secondary"
      label="Attach"
      icon={<Icon name="Link" />}
      onClick={() =>
        history.push(`/accounts/${accountName}/users/${userName}/attachments`)
      }
      aria-label={`Attach ${userName}`}
    />
  );
};

const ActionButtons = ({
  rowValues,
  accountName,
}: {
  rowValues: InternalUser;
  accountName?: string;
}) => {
  const { arn, userName } = rowValues;
  return (
    <Box
      gap={spacing.r12}
      alignSelf="flex-end"
      display="flex"
      alignItems="center"
    >
      <AttachButton userName={userName} accountName={accountName || ''} />
      <EditButton userName={userName} />
      <CopyButton
        textToCopy={arn}
        label="ARN"
        variant="outline"
        size="inline"
      />
      <DeleteUserAction userName={userName} accountName={accountName} />
    </Box>
  );
};

const DeleteUserAction = ({
  userName,
  accountName,
}: {
  userName: string;
  accountName?: string;
}) => {
  const dispatch = useDispatch();
  const IAMClient = useIAMClient();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { data: accessKeysResult, status: accessKeyStatus } =
    useAwsPaginatedEntities(
      getUserAccessKeysQuery(userName, IAMClient),
      (data) => data.AccessKeyMetadata,
    );
  const { data: listGroupsResult, status: listGroupStatus } =
    useAwsPaginatedEntities(
      getUserListGroupsQuery(userName, IAMClient),
      (result) => result.Groups,
      true,
    );
  const {
    data: listAttachedUserPoliciesResult,
    status: listAttachedUserPoliciesStatus,
  } = useAwsPaginatedEntities(
    getListAttachedUserPoliciesQuery(
      userName,
      notFalsyTypeGuard(accountName),
      IAMClient,
    ),
    (result) => result?.AttachedPolicies || [],
    true,
  );

  const deleteUserMutation = useMutation(
    (userName: string) => {
      return IAMClient.deleteUser(userName);
    },
    {
      onSuccess: () =>
        queryClient.invalidateQueries(
          getListUsersQuery(notFalsyTypeGuard(accountName), IAMClient).queryKey,
        ),
      onError: (error) => {
        try {
          //@ts-expect-error fix this when you are working on it
          dispatch(handleClientError(error));
        } catch (err) {
          dispatch(handleApiError(err as ApiError, 'byModal'));
        }
      },
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
        disabled={
          (accessKeysResult && accessKeysResult?.length >= 1) ||
          (listGroupsResult && listGroupsResult.length >= 1) ||
          (listAttachedUserPoliciesResult &&
            listAttachedUserPoliciesResult?.length >= 1) ||
          accessKeyStatus === 'loading' ||
          listGroupStatus === 'loading' ||
          listAttachedUserPoliciesStatus === 'loading'
        }
        icon={<Icon name="Delete" />}
        style={{ height: spacing.r24, marginLeft: '0.6rem' }}
        label=""
        onClick={() => {
          setShowModal(true);
        }}
        variant="danger"
        tooltip={
          accessKeysResult && accessKeysResult?.length >= 1
            ? {
                overlay: `You can't delete the user with access keys`,
                overlayStyle: { width: '10rem' },
              }
            : (listGroupsResult && listGroupsResult.length >= 1) ||
              (listAttachedUserPoliciesResult &&
                listAttachedUserPoliciesResult?.length >= 1)
            ? {
                overlay: `You can't delete the user with attachments`,
                overlayStyle: { width: '10rem' },
              }
            : {
                overlay: 'Delete',
              }
        }
      />
    </>
  );
};

const AccountUserList = ({ accountName }: { accountName?: string }) => {
  const history = useHistory();
  const listUsersQuery = (IAMClient?: IAMClient | null) =>
    getListUsersQuery(notFalsyTypeGuard(accountName), IAMClient);
  const getEntitiesFromResult = (page) => page.Users;

  const prepareData = (
    queryResult: AWS_PAGINATED_ENTITIES<User>,
  ): InternalUser[] => {
    if (queryResult.firstPageStatus === 'success') {
      const iamUsers =
        queryResult.data?.map((user) => {
          return {
            userName: user.UserName,
            createdOn: user.CreateDate,
            accessKeys: null,
            arn: user.Arn,
            actions: null,
          };
        }) || [];

      return iamUsers;
    }
    return [];
  };

  const filterData = (iamUsers: InternalUser[], search?: string | null) => {
    if (search) {
      return iamUsers.filter((user: InternalUser) =>
        user.userName.toLowerCase().startsWith(search.toLowerCase()),
      );
    }
    return iamUsers;
  };

  const columns = [
    {
      Header: 'User Name',
      accessor: 'userName',
      cellStyle: {
        flex: 3,
        width: 'unset',
        minWidth: '5rem',
      },
    },
    {
      Header: 'Access Keys',
      accessor: 'accessKeys',
      cellStyle: {
        width: 'unset',
        textAlign: 'right',
        flex: 1,
        minWidth: '6rem',
      },
      Cell: renderAccessKeyComponent,
    },
    {
      Header: 'Created On',
      accessor: 'createdOn',
      cellStyle: {
        width: 'unset',
        textAlign: 'right',
        flex: 1,
        minWidth: '7rem',
      },
      Cell: ({ value }: { value: Date }) => (
        <FormattedDateTime format="date-time" value={value} />
      ),
      sortType: (row1: Row<InternalUser>, row2: Row<InternalUser>) =>
        row1.original.createdOn.getTime() - row2.original.createdOn.getTime(),
    }, // Table cell for all the actions (Copy ARN, Edit and Delete)
    {
      Header: '',
      accessor: 'actions',
      cellStyle: {
        textAlign: 'right',
        width: '24rem',
        marginRight: spacing.r12,
      },
      disableSortBy: true,
      Cell: (value: CellProps<InternalUser>) => (
        <ActionButtons
          rowValues={value.row.original}
          accountName={accountName}
        />
      ),
    },
  ];
  return (
    <AwsPaginatedResourceTable
      //@ts-expect-error fix this when you are working on it
      columns={columns}
      additionalHeaders={
        <Button
          icon={<Icon name="Create-add" color="textSecondary" />}
          label="Create User"
          variant="primary"
          onClick={() => history.push('create-user')}
          type="submit"
        />
      }
      defaultSortingKey={'userName'}
      //@ts-expect-error fix this when you are working on it
      getItemKey={(index, iamUsers) => {
        return iamUsers[index].Arn;
      }}
      query={{
        getResourceQuery: listUsersQuery,
        getEntitiesFromResult,
        prepareData,
        filterData,
      }}
      labels={{
        singularResourceName: 'user',
        pluralResourceName: 'users',
        loading: 'Loading users...',
        disabledSearchWhileLoading: 'Search is disabled while loading users',
        errorPreviousHeaders:
          'An error occured, users listing may be incomplete. Please retry' +
          ' and if the error persist contact your support.',
      }}
    />
  );
};

export default AccountUserList;
