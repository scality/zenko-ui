import {
  Banner,
  FormattedDateTime,
  Icon,
  Wrap,
  spacing,
} from '@scality/core-ui';
import { Button, CopyButton, Table } from '@scality/core-ui/dist/next';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row } from 'react-table';
import styled from 'styled-components';
import type { Account } from '../../../../types/account';
import type { AppState } from '../../../../types/state';
import { useDataServiceRole } from '../../../DataServiceRoleProvider';
import {
  deleteAccountAccessKey,
  listAccountAccessKeys,
  openAccountKeyCreateModal,
} from '../../../actions';
import DeleteConfirmation from '../../../ui-elements/DeleteConfirmation';

const AccessKeysDetails = styled.div`
  display: block;
  margin-top: ${spacing.r20};
`;

const TableContainer = styled.div`
  height: 12.5rem;
`;

const ButtonContainer = styled.div`
  margin-left: auto;
`;

const EllipsisCell = styled.div`
  overflow: hidden;
  overflow-wrap: break-word;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
`;

type Props = {
  account: Account;
};

type AccessKey = {
  access_key: string;
  created_at: string;
};

function DeleteKey({ accessKey }: { accessKey: string }) {
  const dispatch = useDispatch();
  const { roleArn } = useDataServiceRole();
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState(false);

  return (
    <>
      <Button
        disabled={false}
        icon={<Icon name="Delete" />}
        onClick={() => setShowDeleteConfirmationModal(true)}
        variant="danger"
        tooltip={{
          overlay: 'Remove Key',
          placement: 'right',
        }}
      />
      <DeleteConfirmation
        show={showDeleteConfirmationModal}
        cancel={() => setShowDeleteConfirmationModal(false)}
        approve={() => dispatch(deleteAccountAccessKey(roleArn, accessKey))}
        titleText={`Permanently remove the following access key ${accessKey} ?`}
      />
    </>
  );
}

function AccountKeys({ account }: Props) {
  const dispatch = useDispatch();
  const accessKeysInfo = useSelector(
    (state: AppState) => state.account.accessKeyList,
  );
  const { roleArn } = useDataServiceRole();
  useEffect(() => {
    dispatch(listAccountAccessKeys(roleArn));
  }, [dispatch, roleArn]);

  const handleOpenKeyModal = () => {
    dispatch(openAccountKeyCreateModal());
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Access key ID',
        accessor: 'access_key',
        cellStyle: {
          flex: '0.3',
        },
        Cell({ value: access_key }: { value: string }) {
          return (
            <Wrap style={{ alignItems: 'center' }}>
              {access_key}
              <CopyButton textToCopy={access_key} />
            </Wrap>
          );
        },
      },
      {
        Header: 'Created On',
        accessor: 'created_at',
        cellStyle: {
          flex: '0.25',
          textAlign: 'right',
          marginRight: '1rem',
        },
        sortType: (
          accessKeyRow1: Row<AccessKey>,
          accessKeyRow2: Row<AccessKey>,
        ) => {
          const createdAt1 = new Date(accessKeyRow1.original.created_at);
          const createdAt2 = new Date(accessKeyRow2.original.created_at);

          if (createdAt1.getTime() < createdAt2.getTime()) {
            return 1;
          }

          if (createdAt1.getTime() > createdAt2.getTime()) {
            return -1;
          }

          return 0;
        },

        Cell({ value }: { value: string }) {
          return (
            <FormattedDateTime format="date-time" value={new Date(value)} />
          );
        },
      },
      {
        id: 'actions',
        Header: '',
        accessor: 'access_key',
        disableSortBy: true,
        cellStyle: {
          flex: '1',
        },

        Cell({ value: access_key }: { value: string }) {
          return (
            <Wrap marginRight={spacing.r8}>
              <div></div>
              <DeleteKey accessKey={access_key} />
            </Wrap>
          );
        },
      },
    ],
    [dispatch, account.Name],
  );
  const accessKeys = useMemo(
    () =>
      accessKeysInfo.map((accessKeyInfo) => {
        return {
          access_key: accessKeyInfo.AccessKeyId,
          created_at: accessKeyInfo.CreateDate,
        };
      }),
    [accessKeysInfo],
  );

  return (
    <AccessKeysDetails>
      <h3>Root user Access keys details</h3>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {accessKeys && accessKeys.length > 0 && (
          <div data-testid="root-access-keys-banner">
            <Banner variant="danger" icon={<Icon name="Exclamation-circle" />}>
              <>
                Security Status: Root user Access keys give unrestricted access
                to account resources. It is a best practice to delete root
                Access keys and use IAM user access keys instead.
              </>
            </Banner>
          </div>
        )}
        <ButtonContainer>
          <Button
            variant="primary"
            icon={<Icon name="Create-add" />}
            onClick={handleOpenKeyModal}
            label="Create Access key"
          />
        </ButtonContainer>
      </div>
      <TableContainer>
        <Table
          entityName={{
            en: {
              singular: 'access key',
              plural: 'access keys',
            },
          }}
          //@ts-expect-error fix this when you are working on it
          columns={columns}
          data={accessKeys}
          defaultSortingKey="created_at"
        >
          <Table.SingleSelectableContent
            rowHeight="h40"
            separationLineVariant="backgroundLevel3"
            backgroundVariant="backgroundLevel1"
          />
        </Table>
      </TableContainer>
    </AccessKeysDetails>
  );
}

export default AccountKeys;
