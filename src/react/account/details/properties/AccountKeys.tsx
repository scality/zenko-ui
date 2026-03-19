import { Banner, FormattedDateTime, Icon, spacing, Wrap } from '@scality/core-ui';
import { Button, CopyButton, Table } from '@scality/core-ui/dist/next';
import { useMemo, useState } from 'react';
import type { Row } from 'react-table';
import styled from 'styled-components';
import type { Account } from '../../../../types/account';
import { useModalError } from '../../../ErrorProvider';
import DeleteConfirmation from '../../../ui-elements/DeleteConfirmation';
import { useAccessKeysQuery, useDeleteAccessKeyMutation } from './useAccessKeysQuery';

const AccessKeysDetails = styled.div`
  display: block;
  margin-top: ${spacing.r16};
`;

const TableContainer = styled.div`
  height: 12.5rem;
`;

const ButtonContainer = styled.div`
  margin-left: auto;
  padding: ${spacing.r16};
`;

type Props = {
  account: Account;
  onOpenKeyModal: () => void;
};

type AccessKey = {
  access_key: string;
  created_at: Date;
};

type DeleteKeyProps = {
  accessKey: string;
};

function DeleteKey({ accessKey }: DeleteKeyProps) {
  const { showModalError } = useModalError();
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const deleteAccessKeyMutation = useDeleteAccessKeyMutation();

  const handleDelete = () => {
    deleteAccessKeyMutation.mutate(accessKey, {
      onError: (error: any) => {
        showModalError(error.message || 'Failed to delete access key');
      },
    });
    setShowDeleteConfirmationModal(false);
  };

  return (
    <>
      <Button
        disabled={deleteAccessKeyMutation.isLoading}
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
        approve={handleDelete}
        titleText={`Permanently remove the following access key ${accessKey} ?`}
      />
    </>
  );
}

function AccountKeys({ account, onOpenKeyModal }: Props) {
  const { data: accessKeysInfo, isLoading } = useAccessKeysQuery();

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
        sortType: (accessKeyRow1: Row<AccessKey>, accessKeyRow2: Row<AccessKey>) => {
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

        Cell({ value }: { value: Date }) {
          return <FormattedDateTime format="date-time" value={value} />;
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
    [],
  );

  const accessKeys = useMemo(
    () =>
      (accessKeysInfo || []).map((accessKeyInfo) => {
        return {
          access_key: accessKeyInfo.AccessKeyId,
          created_at: accessKeyInfo.CreateDate,
        };
      }),
    [accessKeysInfo],
  );

  if (isLoading) {
    return (
      <AccessKeysDetails>
        <h3 style={{ marginLeft: spacing.r16 }}>Root user Access keys details</h3>
        <div style={{ padding: spacing.r16 }}>Loading...</div>
      </AccessKeysDetails>
    );
  }

  return (
    <AccessKeysDetails>
      <h3 style={{ marginLeft: spacing.r16 }}>Root user Access keys details</h3>
      <Wrap alignItems="center" paddingLeft={spacing.r16}>
        {accessKeys && accessKeys.length > 0 && (
          <div data-testid="root-access-keys-banner">
            <Banner variant="danger" icon={<Icon name="Exclamation-circle" />}>
              <>
                Security Status: Root user Access keys give unrestricted access to account resources. It is a best
                practice to delete root Access keys and use IAM user access keys instead.
              </>
            </Banner>
          </div>
        )}
        <ButtonContainer>
          <Button
            variant="primary"
            icon={<Icon name="Create-add" />}
            onClick={onOpenKeyModal}
            label="Create Access key"
          />
        </ButtonContainer>
      </Wrap>
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
          <Table.SingleSelectableContent rowHeight="h40" separationLineVariant="backgroundLevel1" />
        </Table>
      </TableContainer>
    </AccessKeysDetails>
  );
}

export default AccountKeys;
