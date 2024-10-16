import { useState } from 'react';
import { generatePath, useHistory, useRouteMatch } from 'react-router-dom';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { Stack, Tooltip, Wrap, spacing, Icon } from '@scality/core-ui';
import { CustomModal as Modal, ModalBody } from '../ui-elements/Modal';
import { regexArn, SCALITY_INTERNAL_ROLES, useAccounts } from '../utils/hooks';
import {
  useCurrentAccount,
  useDataServiceRole,
  useSetAssumedRole,
} from '../DataServiceRoleProvider';
import { AccountSelectorButton } from '../ui-elements/Table';

export function AccountRoleSelectButtonAndModal({
  bigButton,
  buttonLabel,
}: {
  bigButton?: boolean;
  buttonLabel?: string;
}) {
  const { accounts } = useAccounts();
  const { path } = useRouteMatch();
  const { account } = useCurrentAccount();
  const { roleArn } = useDataServiceRole();
  const [assumedRoleArn, setAssumedRoleArn] = useState(roleArn);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const accountName = account?.Name;
  const [assumedAccount, setAssumedAccount] = useState(accountName);
  const setRole = useSetAssumedRole();
  const history = useHistory();

  const accountsWithRoles: {
    accountName: string;
    roleName: string;
    rolePath: string;
    roleArn: string;
  }[] = [];

  accounts.forEach((account) => {
    const accountName = account.Name;
    account.Roles.forEach((role) => {
      const parsedArn = regexArn.exec(role.Arn);
      const rolePath = parsedArn?.groups['path'] || '';
      const roleName = parsedArn?.groups['name'] || '';
      accountsWithRoles.push({
        accountName,
        roleName,
        rolePath,
        roleArn: role.Arn,
      });
    });
  });

  const handleClose = () => {
    setIsModalOpen(false);
  };
  const modalFooter = () => {
    return (
      <Wrap>
        <p></p>
        <Stack>
          <Button variant="outline" onClick={handleClose} label="Cancel" />
          <Button
            icon={<Icon name="Arrow-right" />}
            variant="primary"
            onClick={() => {
              setRole({ roleArn: assumedRoleArn });
              history.push(
                generatePath(path, {
                  accountName: assumedAccount,
                }),
              );
              handleClose();
            }}
            label="Continue"
            disabled={assumedRoleArn === roleArn}
          />
        </Stack>
      </Wrap>
    );
  };

  function AccountRoleList() {
    const columns = [
      {
        Header: 'Account Name',
        accessor: 'accountName',
        cellStyle: {
          minWidth: '10rem',
          paddingLeft: '1rem',
        },
      },
      {
        Header: 'Role Name',
        accessor: 'roleName',
        cellStyle: {
          minWidth: '12rem',
          marginRight: '10rem',
        },
        Cell({ value: roleName }: { value: string }) {
          if (SCALITY_INTERNAL_ROLES.includes(roleName)) {
            return (
              <span>
                {roleName}
                <Tooltip
                  overlay={'This is a Scality predefined Role'}
                  overlayStyle={{
                    width: '12rem',
                  }}
                >
                  <Icon
                    name="Info"
                    size="xs"
                    color="buttonSecondary"
                    //@ts-expect-error fix this when you are working on it
                    style={{ fontSize: '1rem', marginLeft: spacing.r8 }}
                  />
                </Tooltip>
              </span>
            );
          } else {
            return <>{roleName}</>;
          }
        },
      },
      {
        Header: 'Role Path',
        accessor: 'rolePath',
        cellStyle: {
          minWidth: '10rem',
        },
      },
    ];

    return (
      <div style={{ height: '25rem' }}>
        <Table
          //@ts-expect-error fix this when you are working on it
          columns={columns}
          data={accountsWithRoles}
          defaultSortingKey={'accountName'}
          getRowId={(row) => row.roleArn}
        >
          <Table.SingleSelectableContent
            rowHeight="h32"
            separationLineVariant="backgroundLevel3"
            onRowSelected={(rowData) => {
              //@ts-expect-error fix this when you are working on it
              setAssumedRoleArn(rowData.original.roleArn);
              //@ts-expect-error fix this when you are working on it
              setAssumedAccount(rowData.original.accountName);
            }}
            selectedId={assumedRoleArn}
          ></Table.SingleSelectableContent>
        </Table>
      </div>
    );
  }

  return (
    <>
      <AccountSelectorButton
        bigButton={bigButton}
        variant="primary"
        onClick={() => {
          setIsModalOpen(true);
        }}
        label={
          buttonLabel ? (
            buttonLabel
          ) : (
            <>
              {accountName}
              <Box ml={12}>
                <Icon name="Chevron-down" size="xs" />
              </Box>
            </>
          )
        }
        icon={<Icon name="Account" />}
      />
      <Modal
        close={handleClose}
        footer={modalFooter()}
        isOpen={isModalOpen}
        title="Select Account and Role to assume"
      >
        <ModalBody>
          <AccountRoleList />
        </ModalBody>
      </Modal>
    </>
  );
}

export default AccountRoleSelectButtonAndModal;
