import { AppContainer, Banner, Stack, Toggle, Tooltip } from '@scality/core-ui';
import { Icon } from '@scality/core-ui/dist/components/icon/Icon.component';
import { TextBadge } from '@scality/core-ui/dist/components/textbadge/TextBadge.component';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import {
  Route,
  useHistory,
  useLocation,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import { Column } from 'react-table';
import styled from 'styled-components';
import { useIAMClient } from '../IAMProvider';
import { getUserAccessKeysQuery } from '../queries';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import { Clipboard } from '../ui-elements/Clipboard';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { TitleRow as TableHeader } from '../ui-elements/TableKeyValue';
import { formatSimpleDate } from '../utils';
import {
  useAccessKeyOutdatedStatus,
  useAwsPaginatedEntities,
} from '../utils/IAMhooks';
import AccountUserSecretKeyModal from './AccountUserSecretKeyModal';

const CustomIcon = styled.i`
  color: ${(props) => props.color ?? props.theme.infoPrimary};
  font-size: 32px;
`;

const CreatedOnCell = (rowValue) => {
  const outdatedAlert = useAccessKeyOutdatedStatus(rowValue);
  return (
    <div>
      {outdatedAlert ? (
        <Tooltip
          overlay={outdatedAlert}
          overlayStyle={{
            width: '20rem',
          }}
        >
          <Icon name="Exclamation-circle" color="statusWarning" />
        </Tooltip>
      ) : null}
      {rowValue.createdOn}
    </div>
  );
};

const ToggleAccessKeyStatus = (rowValue) => {
  const { accessKey, status: accessKeyStatus } = rowValue;
  const IAMClient = useIAMClient();
  const queryClient = useQueryClient();
  const { IAMUserName } = useParams<{
    IAMUserName: string;
  }>();
  const updateAccessKeyMutation = useMutation(
    (accessKey) => {
      return IAMClient.updateAccessKey(
        //@ts-expect-error fix this when you are working on it
        accessKey,
        accessKeyStatus === 'Active' ? 'Inactive' : 'Active',
        IAMUserName,
      );
    },
    {
      onSuccess: () =>
        queryClient.invalidateQueries(
          getUserAccessKeysQuery(IAMUserName, IAMClient).queryKey,
        ),
    },
  );
  return (
    <div>
      <Toggle
        disabled={IAMClient === null}
        toggle={accessKeyStatus === 'Active'}
        label={accessKeyStatus}
        onChange={() => {
          updateAccessKeyMutation.mutate(accessKey);
        }}
      />
    </div>
  );
};

const AccessKeysCell = (rowValue) => {
  const { accessKey } = rowValue;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      {accessKey} <Clipboard text={accessKey} />
    </div>
  );
};

const DeleteAccessKeyAction = (rowValue) => {
  const { accessKey, status: accessKeyStatus } = rowValue;
  const IAMClient = useIAMClient();
  const queryClient = useQueryClient();
  const { IAMUserName } = useParams<{
    IAMUserName: string;
  }>();
  const [showModal, setShowModal] = useState(false);
  const deleteAccessKeyMutation = useMutation(
    //@ts-expect-error fix this when you are working on it
    (accessKey) => IAMClient.deleteAccessKey(accessKey, IAMUserName),
    {
      onSuccess: () =>
        queryClient.invalidateQueries(
          getUserAccessKeysQuery(IAMUserName, IAMClient).queryKey,
        ),
    },
  );
  return (
    <>
      <DeleteConfirmation
        show={showModal}
        cancel={() => setShowModal(false)}
        approve={() => {
          deleteAccessKeyMutation.mutate(accessKey);
        }}
        titleText={`Delete User Key? \n
                    Permanently remove the following Key ${accessKey} ?`}
      />
      <Button
        id="delete-accessKey-btn"
        disabled={accessKeyStatus === 'Active'}
        icon={<Icon name="Delete" />}
        label="Delete"
        onClick={() => {
          setShowModal(true);
        }}
        variant="danger"
        tooltip={{
          overlay:
            accessKeyStatus === 'Active'
              ? 'A key cannot be deleted while active.'
              : 'Remove accessKey',
          placement: 'right',
        }}
      />
    </>
  );
};

const AccountUserAccessKeys = () => {
  const { pathname } = useLocation();
  const { IAMUserName } = useParams<{
    IAMUserName: string;
  }>();
  const history = useHistory();
  const IAMClient = useIAMClient();
  const { url } = useRouteMatch();
  const { data: accessKeysResult, status: accessKeysStatus } =
    useAwsPaginatedEntities(
      getUserAccessKeysQuery(IAMUserName, IAMClient),
      (data) => data.AccessKeyMetadata,
    );

  const data = useMemo(() => {
    if (accessKeysStatus === 'success') {
      return accessKeysResult.map((accesskey) => {
        return {
          accessKey: accesskey.AccessKeyId,
          createdOn: formatSimpleDate(accesskey.CreateDate),
          status: accesskey.Status,
          actions: accesskey,
        };
      });
    } else {
      return [];
    }
  }, [accessKeysStatus, accessKeysResult]);
  const columns = [
    {
      Header: 'Access Keys',
      accessor: 'accessKey',
      cellStyle: {
        minWidth: '20rem',
      },
      Cell: (value) => AccessKeysCell(value.row.original),
    },
    {
      Header: 'Created On',
      accessor: 'createdOn',
      Cell: (value) => CreatedOnCell(value.row.original),
      cellStyle: {
        minWidth: '10rem',
        textAlign: 'right',
        paddingRight: spacing.sp32,
      },
    },
    {
      Header: 'Status',
      accessor: 'status',
      cellStyle: {
        textAlign: 'left',
        marginRight: spacing.sp32,
      },
      Cell: (value) => ToggleAccessKeyStatus(value.row.original),
    },
    {
      Header: '',
      accessor: 'actions',
      cellStyle: {
        textAlign: 'right',
        marginLeft: 'auto',
      },
      Cell: (value) => DeleteAccessKeyAction(value.row.original),
    },
  ];
  const accessKeysResultLength = accessKeysResult?.length ?? 0;
  const accessKeysCountComponent = useMemo(() => {
    if (accessKeysStatus === 'loading' || accessKeysStatus === 'idle') {
      return 'Loading access keys...';
    } else if (accessKeysResultLength > 2) {
      return (
        <Stack gap="r32">
          <Box>
            Access Keys
            <TextBadge
              variant={'statusWarning'}
              //@ts-expect-error fix this when you are working on it
              text={accessKeysResultLength}
              style={{ marginLeft: spacing.sp8 }}
            />
          </Box>
          <Banner
            icon={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: spacing.sp8,
                }}
              >
                <Icon
                  name="Exclamation-circle"
                  size="lg"
                  color="statusWarning"
                />
              </div>
            }
            //@ts-expect-error fix this when you are working on it
            variant="statusWarning"
            title="Warning"
          >
            Security Status: as a best practice, an user should not have more
            than 2 Access keys
          </Banner>
        </Stack>
      );
    } else {
      return `Access Keys ${accessKeysResultLength}`;
    }
  }, [accessKeysStatus, accessKeysResultLength]);
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppContainer.ContextContainer>
        <BreadcrumbAccount pathname={pathname} />
      </AppContainer.ContextContainer>
      <AppContainer.OverallSummary>
        <Stack withSeparators gap="r32">
          <>
            <CustomIcon
              color="white"
              className="fas fa-arrow-left"
              style={{
                cursor: 'pointer',
              }}
              onClick={() => {
                history.push('../');
              }}
            />
            <CustomIcon className="fas fa-key" />
            <>{`Access Keys for: ${IAMUserName}`}</>
          </>
          <>{accessKeysCountComponent}</>
        </Stack>
      </AppContainer.OverallSummary>

      <AppContainer.MainContent hasPadding background="backgroundLevel3">
        <Box style={{ flex: 1 }}>
          {/* fix this when you are working on it*/}
          <Table
            columns={columns as unknown as Column[]}
            data={data}
            defaultSortingKey={'health'}
          >
            <TableHeader
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                icon={<Icon name="Create-add" />}
                label="Create Access Keys"
                variant="primary"
                onClick={() => history.push('access-keys/create')}
                type="submit"
              />
            </TableHeader>
            <Table.SingleSelectableContent
              rowHeight="h40"
              separationLineVariant="backgroundLevel1"
              backgroundVariant="backgroundLevel3"
            >
              {(Rows) => (
                <>
                  {accessKeysStatus === 'loading' || accessKeysStatus === 'idle'
                    ? 'Loading access keys...'
                    : ''}
                  {accessKeysStatus === 'error'
                    ? 'We failed to retrieve access keys, please retry later. If the error persists, please contact your support.'
                    : ''}
                  {accessKeysStatus === 'success' ? Rows : ''}
                </>
              )}
            </Table.SingleSelectableContent>
          </Table>
        </Box>
      </AppContainer.MainContent>
      <Route path={`${url}/create`}>
        <AccountUserSecretKeyModal IAMUserName={IAMUserName} />
      </Route>
    </div>
  );
};

export default AccountUserAccessKeys;
