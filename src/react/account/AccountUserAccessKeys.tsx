import {
  AppContainer,
  Banner,
  FormattedDateTime,
  Stack,
  Toggle,
  Tooltip,
  Wrap,
  Icon,
  TextBadge,
  spacing,
} from '@scality/core-ui';
import { Box, Button, CopyButton, Table } from '@scality/core-ui/dist/next';
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
import styled, { useTheme } from 'styled-components';
import { useIAMClient } from '../IAMProvider';
import { getUserAccessKeysQuery } from '../queries';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { formatSimpleDate } from '../utils';
import {
  useAccessKeyOutdatedStatus,
  useAwsPaginatedEntities,
} from '../utils/IAMhooks';
import AccountUserSecretKeyModal from './AccountUserSecretKeyModal';
import { TableHeaderWrapper } from '../ui-elements/Table';

const CustomIcon = styled.i`
  color: ${(props) => props.theme.textSecondary};
  font-size: 32px;
  cursor: pointer;
  :hover {
    color: ${(props) => props.theme.textPrimary};
  }
`;

const CreatedOnCell = (rowValue) => {
  const outdatedAlert = useAccessKeyOutdatedStatus(rowValue);
  return (
    <Box gap={spacing.r4} justifyContent="right">
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
      {
        <FormattedDateTime
          format="date-time"
          value={new Date(rowValue.createdOn)}
        />
      }
    </Box>
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
    <Wrap alignItems="center">
      {accessKey} <CopyButton textToCopy={accessKey} />
    </Wrap>
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
  const theme = useTheme();
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
        paddingRight: spacing.r32,
      },
    },
    {
      Header: 'Status',
      accessor: 'status',
      cellStyle: {
        textAlign: 'left',
        marginRight: spacing.r32,
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
          <Stack gap="r8">
            <>Access Keys</>
            <TextBadge
              variant={'statusWarning'}
              text={`${accessKeysResultLength}`}
            />
          </Stack>
          <Banner
            icon={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: spacing.r8,
                }}
              >
                <Icon
                  name="Exclamation-circle"
                  size="lg"
                  color="statusWarning"
                />
              </div>
            }
            variant="warning"
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
              className="fas fa-arrow-left"
              onClick={() => {
                history.push('../');
              }}
            />
            <Icon name="Key" size="2x" color={theme.infoPrimary} />
            <>{`Access Keys for: ${IAMUserName}`}</>
          </>
          <>{accessKeysCountComponent}</>
        </Stack>
      </AppContainer.OverallSummary>

      <AppContainer.MainContent background="backgroundLevel3">
        <Table
          columns={columns as unknown as Column[]}
          data={data}
          defaultSortingKey={'health'}
          status={accessKeysStatus}
          entityName={{
            en: {
              singular: 'access key',
              plural: 'access keys',
            },
          }}
        >
          <TableHeaderWrapper
            actions={
              <Button
                icon={<Icon name="Create-add" />}
                label="Create Access Keys"
                variant="primary"
                onClick={() => history.push('access-keys/create')}
                type="submit"
              />
            }
          />
          <Table.SingleSelectableContent
            rowHeight="h40"
            separationLineVariant="backgroundLevel1"
          ></Table.SingleSelectableContent>
        </Table>
      </AppContainer.MainContent>
      <Route path={`${url}/create`}>
        <AccountUserSecretKeyModal IAMUserName={IAMUserName} />
      </Route>
    </div>
  );
};

export default AccountUserAccessKeys;
