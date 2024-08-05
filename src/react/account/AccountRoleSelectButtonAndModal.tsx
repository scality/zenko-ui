import { useMemo, useState } from 'react';
import { generatePath, useHistory, useRouteMatch } from 'react-router-dom';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { Stack, Tooltip, Wrap, Icon } from '@scality/core-ui';
import { CustomModal as Modal, ModalBody } from '../ui-elements/Modal';
import { regexArn, SCALITY_INTERNAL_ROLES, useAccounts } from '../utils/hooks';
import {
  useCurrentAccount,
  useDataServiceRole,
  useSetAssumedRole,
} from '../DataServiceRoleProvider';
import { AccountSelectorButton } from '../ui-elements/Table';

function AccountRoleList({ accountsWithRoles, onRowSelected }) {
  const { roleArn } = useDataServiceRole();
  const [assumedRoleArn, setAssumedRoleArn] = useState(roleArn);
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
            <Stack gap="r8">
              {roleName}
              <Tooltip
                overlay={'This is a Scality predefined Role'}
                overlayStyle={{
                  width: '12rem',
                }}
              >
                <Icon name="Info" color="buttonSecondary" />
              </Tooltip>
            </Stack>
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
        columns={columns}
        data={accountsWithRoles}
        defaultSortingKey={'accountName'}
        // @ts-expect-error fix this when you are working on it
        getRowId={(row) => row.roleArn}
      >
        <Table.SingleSelectableContent
          rowHeight="h32"
          separationLineVariant="backgroundLevel3"
          onRowSelected={(rowData) => {
            //@ts-expect-error fix this when you are working on it
            setAssumedRoleArn(rowData.original.roleArn);
            onRowSelected(rowData);
          }}
          selectedId={assumedRoleArn}
        ></Table.SingleSelectableContent>
      </Table>
    </div>
  );
}

export function AccountRoleSelectButtonAndModal({
  bigButton,
  buttonLabel,
}: {
  bigButton?: boolean;
  buttonLabel?: string;
}) {
  const { accounts } = useAccounts();
  const { account } = useCurrentAccount();
  const { roleArn } = useDataServiceRole();
  const [assumedRoleArn, setAssumedRoleArn] = useState(roleArn);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const accountName = account?.Name;
  const [assumedAccount, setAssumedAccount] = useState(accountName);
  const setRole = useSetAssumedRole();

  const accountRolesHash = accounts
    ?.map((acc) => acc.Name + acc.Roles.map((role) => role.Arn).join(''))
    ?.join('');

  const accountsWithRoles: {
    accountName: string;
    roleName: string;
    rolePath: string;
    roleArn: string;
  }[] = useMemo(() => {
    return (
      accounts?.flatMap((account) => {
        const accountName = account.Name;
        return account.Roles.map((role) => {
          const parsedArn = regexArn.exec(role.Arn);
          const rolePath = parsedArn?.groups['path'] || '';
          const roleName = parsedArn?.groups['name'] || '';
          return {
            accountName,
            roleName,
            rolePath,
            roleArn: role.Arn,
          };
        });
      }) || []
    );
  }, [accountRolesHash]);

  const handleClose = () => {
    setIsModalOpen(false);
  };

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
        footer={
          <ModalFooter
            setRole={setRole}
            handleClose={handleClose}
            roleArn={roleArn}
            assumedAccount={assumedAccount}
            assumedRoleArn={assumedRoleArn}
          />
        }
        isOpen={isModalOpen}
        title="Select Account and Role to assume"
      >
        <ModalBody>
          <AccountRoleList
            accountsWithRoles={accountsWithRoles}
            onRowSelected={(rowData) => {
              setAssumedRoleArn(rowData.original.roleArn);
              setAssumedAccount(rowData.original.accountName);
            }}
          />
        </ModalBody>
      </Modal>
    </>
  );
}

const ModalFooter = ({
  handleClose,
  setRole,
  assumedRoleArn,
  roleArn,
  assumedAccount,
}) => {
  const history = useHistory();
  const { path } = useRouteMatch();
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

export default AccountRoleSelectButtonAndModal;
