import { Icon, Modal, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useMutation, useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

import { useState } from 'react';
import type { Account } from '../../../../types/account';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { useManagementClient } from '../../../ManagementProvider';
import {
  useAccountsLocationsAndEndpoints,
  useListAccounts,
} from '../../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../../../next-architecture/ui/AuthProvider';
import { Clipboard } from '../../../ui-elements/Clipboard';
import { ButtonContainer } from '../../../ui-elements/Container';
import DeleteConfirmation from '../../../ui-elements/DeleteConfirmation';
import * as T from '../../../ui-elements/TableKeyValue';
import Table, { TitleRow } from '../../../ui-elements/TableKeyValue';
import { formatDate } from '../../../utils';
import {
  useAccounts,
  useAuthGroups,
  useRolePathName,
} from '../../../utils/hooks';
import { removeRoleArnStored } from '../../../utils/localStorage';
import SecretKeyModal from './SecretKeyModal';
import { useSetAssumedRole } from '../../../DataServiceRoleProvider';
import { useAccessibleAccountsAdapter } from '../../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { useMetricsAdapter } from '../../../next-architecture/ui/MetricsAdapterProvider';

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
type Props = {
  account: Account;
};

function DeleteAccountButtonAndModal({ account }: Props) {
  const [isModalOpened, setIsModalOpened] = useState(false);
  const history = useHistory();
  const queryClient = useQueryClient();
  const rolePathName = useRolePathName();

  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });
  const instanceId = useInstanceId();
  const managementClient = useManagementClient();

  const deleteMutation = useMutation({
    mutationFn: () => {
      return notFalsyTypeGuard(managementClient)
        .deleteConfigurationOverlayUser(
          instanceId,
          undefined,
          account.Name,
          rolePathName,
        )
        .catch(async (error: Response) => {
          if (error.status >= 400 && error.status < 500) {
            if (error.status === 409) {
              throw {
                message:
                  'Unable to delete the account due to the presence of associated resources.',
              };
            }
            throw await error.json();
          }
        });
    },
    onError: () => {
      setIsModalOpened(false);
    },
    onSuccess: () => {
      refetchAccountsLocationsEndpointsMutation.mutate(undefined, {
        onSuccess: () => {
          removeRoleArnStored();
          queryClient.invalidateQueries(['WebIdentityRoles']);
          history.push('/accounts');
          setIsModalOpened(false);
        },
      });
    },
  });

  return (
    <>
      {deleteMutation.isError && (
        <Modal
          title="Error"
          isOpen={true}
          close={() => {
            deleteMutation.reset();
          }}
          footer={
            <Wrap>
              <p></p>
              <Button
                variant="primary"
                onClick={() => {
                  deleteMutation.mutate();
                }}
                label="Retry"
              />
            </Wrap>
          }
        >
          {
            //@ts-expect-error fix this when you are working on it
            deleteMutation.error?.message ||
              'Deletion of the account failed, please retry.'
          }
        </Modal>
      )}
      <DeleteConfirmation
        show={isModalOpened}
        cancel={() => setIsModalOpened(false)}
        approve={() => deleteMutation.mutate()}
        isLoading={
          deleteMutation.isLoading ||
          refetchAccountsLocationsEndpointsMutation.isLoading
        }
        titleText={`Are you sure you want to delete account: ${account.Name} ?`}
      />
      <Button
        id="delete-account-btn"
        icon={<Icon name="Delete" />}
        onClick={() => setIsModalOpened(true)}
        variant="danger"
        label="Delete Account"
      />
    </>
  );
}

function AccountInfo({ account }: Props) {
  const { isStorageManager } = useAuthGroups();

  // TODO: Should we let the user delete accounts that still owns buckets.
  return (
    <TableContainer>
      <SecretKeyModal account={account} />
      <TitleRow>
        <h3>Account details</h3>
        {isStorageManager && (
          <ButtonContainer>
            <DeleteAccountButtonAndModal account={account} />
          </ButtonContainer>
        )}
      </TitleRow>
      <Table id="account-details-table">
        <T.Body>
          <T.Row>
            <T.Key> Account ID </T.Key>
            <T.Value> {account.id} </T.Value>
            <T.ExtraCell>
              {' '}
              <Clipboard text={account.id} />{' '}
            </T.ExtraCell>
          </T.Row>
          <T.Row>
            <T.Key> Name </T.Key>
            <T.Value> {account.Name} </T.Value>
            <T.ExtraCell>
              {' '}
              <Clipboard text={account.Name} />{' '}
            </T.ExtraCell>
          </T.Row>
          <T.Row>
            <T.Key> Creation Date </T.Key>
            <T.Value> {formatDate(new Date(account.CreationDate))} </T.Value>
          </T.Row>
          {/* We have to hide this two fields until the information is ready from GetRolesForWebIdentity() */}
          {/* <T.Row>
            <T.Key> Root User Email </T.Key>
            <T.Value> {account.email} </T.Value>
            <T.ExtraCell>
              {' '}
              <Clipboard text={account.email} />{' '}
            </T.ExtraCell>
          </T.Row>
          <T.Row>
            <T.Key> Root User ARN </T.Key>
            <T.Value> {account.arn} </T.Value>
            <T.ExtraCell>
              {' '}
              <Clipboard text={account.arn} />{' '}
            </T.ExtraCell>
          </T.Row> */}
        </T.Body>
      </Table>
    </TableContainer>
  );
}

export default AccountInfo;
