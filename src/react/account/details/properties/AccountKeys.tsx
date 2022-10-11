import React, { useEffect, useMemo } from 'react';
import {
  deleteAccountAccessKey,
  listAccountAccessKeys,
  openAccountKeyCreateModal,
} from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { Row } from 'react-table';
import type { Account } from '../../../../types/account';
import type { AppState } from '../../../../types/state';
import { Banner, Icon } from '@scality/core-ui';
import { Button, Table } from '@scality/core-ui/dist/next';
import { Clipboard } from '../../../ui-elements/Clipboard';
import { formatShortDate } from '../../../utils';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { useDataServiceRole } from '../../../DataServiceRoleProvider';
import { Warning } from '../../../ui-elements/Warning';

const AccessKeysDetails = styled.div`
  display: block;
  margin-top: ${spacing.sp20};
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
  accessKey: string;
  created_at: string;
};

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
          flex: '0.25',
        },
        Cell({ value: access_key }: { value: string }) {
          return (
            <span
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <EllipsisCell>{access_key}</EllipsisCell>
              <div
                style={{
                  marginLeft: spacing.sp16,
                }}
              >
                <Clipboard text={access_key} />
              </div>
            </span>
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
          return formatShortDate(new Date(value));
        },
      },
      {
        id: 'actions',
        Header: '',
        accessor: 'access_key',
        disableSortBy: true,
        cellStyle: {
          flex: '0.5',
        },

        Cell({ value: access_key }: { value: string }) {
          return (
            <Button
              disabled={false}
              icon={<Icon name="Delete" />}
              onClick={() =>
                dispatch(deleteAccountAccessKey(roleArn, access_key))
              }
              variant="danger"
              tooltip={{
                overlay: 'Remove Key',
                placement: 'right',
              }}
            />
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
            <Banner
              variant="danger"
              icon={<Icon name="Exclamation-triangle" />}
            >
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
        {accessKeys.length > 0 ? (
          <Table
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
        ) : (
          <Warning
            centered
            icon={<Icon name="Exclamation-triangle" />}
            title="No key created"
          />
        )}
      </TableContainer>
    </AccessKeysDetails>
  );
}

export default AccountKeys;
