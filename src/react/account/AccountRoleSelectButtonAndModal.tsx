import { useState } from 'react';
import { useRouteMatch } from 'react-router';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Button } from '@scality/core-ui/dist/next';
import { Stack, Tooltip, Wrap } from '@scality/core-ui';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { CustomModal as Modal, ModalBody } from '../ui-elements/Modal';
import {
  regexArn,
  SCALITY_INTERNAL_ROLES,
  useAccounts,
  useRedirectDataConsumers,
} from '../utils/hooks';
import {
  useCurrentAccount,
  useDataServiceRole,
} from '../DataServiceRoleProvider';
import { getRoleArnStored, setRoleArnStored } from '../utils/localStorage';
import { Icon } from '@scality/core-ui';
import { AccountSelectorButton } from '../ui-elements/Table';

export function AccountRoleSelectButtonAndModal({
  bigButton,
  buttonLabel,
}: {
  bigButton?: boolean;
  buttonLabel?: string;
}) {
  const accounts = useAccounts();
  const { path } = useRouteMatch();
  const { account, selectAccountAndRoleRedirectTo } = useCurrentAccount();
  const { roleArn } = useDataServiceRole();
  const [assumedRoleArn, setAssumedRoleArn] = useState(roleArn);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const accountName = account?.Name;
  const [assumedAccount, setAssumedAccount] = useState(accountName);
  const redirectDataConsummers = useRedirectDataConsumers();

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
              const parsedArn = regexArn.exec(assumedRoleArn);
              const roleName = parsedArn?.groups?.name || '';
              setRoleArnStored(assumedRoleArn);
              selectAccountAndRoleRedirectTo(
                path,
                assumedAccount,
                assumedRoleArn,
              );
              redirectDataConsummers([{ Name: roleName }], handleClose);
              window.location.reload();
            }}
            label="Continue"
            disabled={assumedRoleArn === getRoleArnStored()}
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
                    style={{ fontSize: '1rem', marginLeft: spacing.sp8 }}
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
          columns={columns}
          data={accountsWithRoles}
          defaultSortingKey={'accountName'}
          getRowId={(row) => row.roleArn}
        >
          <Table.SingleSelectableContent
            rowHeight="h32"
            separationLineVariant="backgroundLevel3"
            backgroundVariant="backgroundLevel1"
            onRowSelected={(rowData) => {
              setAssumedRoleArn(rowData.original.roleArn);
              setAssumedAccount(rowData.original.accountName);
            }}
            selectedId={assumedRoleArn}
            children={(Rows) => {
              return <>{Rows}</>;
            }}
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
              <SpacedBox ml={12}>
                <Icon name="Chevron-down" size="xs" />
              </SpacedBox>
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
