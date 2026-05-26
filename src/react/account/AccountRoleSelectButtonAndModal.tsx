import { Icon, Stack, Tooltip, Wrap } from '@scality/core-ui';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useCurrentAccount, useDataServiceRole, useSetAssumedRolePromise } from '../DataServiceRoleProvider';
import { CustomModal as Modal, ModalBody } from '../ui-elements/Modal';
import { AccountSelectorButton } from '../ui-elements/Table';
import { regexArn, SCALITY_INTERNAL_ROLES, STORAGE_MANAGER_ROLE, STORAGE_USAGE_CONSUMER_ROLE, useAccounts } from '../utils/hooks';

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
        if (roleName === STORAGE_USAGE_CONSUMER_ROLE) {
          return (
            <Stack gap="r8">
              {roleName}
              <Tooltip
                overlay={'This role has limited access to some UI sections'}
                overlayStyle={{
                  width: '14rem',
                }}
              >
                <Icon name="Exclamation-circle" color="statusWarning" ariaLabel="Exclamation-circle" />
              </Tooltip>
            </Stack>
          );
        } else if (SCALITY_INTERNAL_ROLES.includes(roleName)) {
          return (
            <Stack gap="r8">
              {roleName}
              <Tooltip
                overlay={'This is a Scality predefined Role'}
                overlayStyle={{
                  width: '12rem',
                }}
              >
                <Icon name="Info" color="buttonSecondary" ariaLabel="Info" />
              </Tooltip>
            </Stack>
          );
        } else {
          return (
            <Stack gap="r8">
              {roleName}
              <Tooltip
                overlay={"Some UI sections may not be available depending on this role's permissions"}
                overlayStyle={{
                  width: '14rem',
                }}
              >
                <Icon name="Info" color="buttonSecondary" ariaLabel="Info" />
              </Tooltip>
            </Stack>
          );
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
        // @ts-expect-error fix this when you are working on it
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

  const accountRolesHash = accounts?.map((acc) => acc.Name + acc.Roles.map((role) => role.Arn).join(''))?.join('');

  const accountsWithRoles: {
    accountName: string;
    roleName: string;
    rolePath: string;
    roleArn: string;
  }[] = useMemo(() => {
    return (
      accounts?.flatMap((account) => {
        const accountName = account.Name;
        const parsedRoles = account.Roles.map((role) => {
          const parsedArn = regexArn.exec(role.Arn);
          return {
            accountName,
            roleName: parsedArn?.groups['name'] || '',
            rolePath: parsedArn?.groups['path'] || '',
            roleArn: role.Arn,
          };
        });
        const storageManagerRoles = parsedRoles.filter(
          (role) => role.roleName === STORAGE_MANAGER_ROLE,
        );
        return storageManagerRoles.length > 0 ? storageManagerRoles : parsedRoles;
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

const ModalFooter = ({ handleClose, assumedRoleArn, roleArn, assumedAccount }) => {
  const setRole = useSetAssumedRolePromise();
  const navigateWithBasename = useBasenameRelativeNavigate();
  const navigate = useNavigate();
  const { accountName } = useParams();
  const location = useLocation();

  const handleAccountClick = () => {
    const replacePath = location.pathname.replace(accountName, assumedAccount);

    if (replacePath.includes('/buckets')) {
      navigateWithBasename(`/accounts/${assumedAccount}/buckets`);
    } else {
      navigate(replacePath);
    }
  };

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
            handleAccountClick();
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
