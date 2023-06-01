// @noflow
import Table, * as T from '../../../ui-elements/TableKeyValue';
import {
  closeAccountDeleteDialog,
  deleteAccount,
  openAccountDeleteDialog,
} from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Account } from '../../../../types/account';
import type { AppState } from '../../../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import { ButtonContainer } from '../../../ui-elements/Container';
import { Clipboard } from '../../../ui-elements/Clipboard';
import DeleteConfirmation from '../../../ui-elements/DeleteConfirmation';
import React from 'react';
import SecretKeyModal from './SecretKeyModal';
import { TitleRow } from '../../../ui-elements/TableKeyValue';
import { formatDate } from '../../../utils';
import styled from 'styled-components';
import { useMutation, useQueryClient } from 'react-query';
import { useRolePathName } from '../../../utils/hooks';
import { Icon } from '@scality/core-ui';
import { queries } from '../../../next-architecture/domain/business/accounts';
import { useAccountsAdapter } from '../../../next-architecture/ui/AccountAdapterProvider';
const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
type Props = {
  account: Account;
};

function AccountInfo({ account }: Props) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const token = useSelector((state: AppState) => state.oidc.user?.access_token);
  const showDelete = useSelector(
    (state: AppState) => state.uiAccounts.showDelete,
  );
  const rolePathName = useRolePathName();

  const handleDeleteClick = () => {
    dispatch(openAccountDeleteDialog());
  };

  const accountsAdapter = useAccountsAdapter();
  const deleteMutation = useMutation({
    mutationFn: () => {
      return dispatch(
        deleteAccount(account.Name, queryClient, token, rolePathName),
      );
    },
    onSuccess: () => {
      queryClient.resetQueries(queries.listAccounts(accountsAdapter).queryKey);
    },
  });

  const handleDeleteApprove = () => {
    if (!account) {
      return;
    }

    deleteMutation.mutate();
  };

  const handleDeleteCancel = () => {
    dispatch(closeAccountDeleteDialog());
  };

  // TODO: Should we let the user delete accounts that still owns buckets.
  return (
    <TableContainer>
      <DeleteConfirmation
        show={showDelete}
        cancel={handleDeleteCancel}
        approve={handleDeleteApprove}
        titleText={`Are you sure you want to delete account: ${account.Name} ?`}
      />
      <SecretKeyModal account={account} />
      <TitleRow>
        <h3>Account details</h3>
        <ButtonContainer>
          <Button
            id="delete-account-btn"
            icon={<Icon name="Delete" />}
            onClick={handleDeleteClick}
            variant="danger"
            label="Delete Account"
          />
        </ButtonContainer>
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
