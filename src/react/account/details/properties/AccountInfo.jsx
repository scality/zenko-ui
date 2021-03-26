// @noflow

import Table, * as T from '../../../ui-elements/TableKeyValue';
import { closeAccountDeleteDialog, deleteAccount, openAccountDeleteDialog } from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Account } from '../../../../types/account';
import type { AppState } from '../../../../types/state';
import { Button } from '@scality/core-ui';
import { ButtonContainer } from '../../../ui-elements/Container';
import { Clipboard } from '../../../ui-elements/Clipboard';
import DeleteConfirmation from '../../../ui-elements/DeleteConfirmation';
import React from 'react';
import { formatDate } from '../../../utils';
import styled from 'styled-components';

const TableContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

type Props = {
    account: Account,
};

function AccountInfo({ account }: Props) {
    const dispatch = useDispatch();
    const showDelete = useSelector((state: AppState) => state.uiAccounts.showDelete);

    const handleDeleteClick = () => {
        dispatch(openAccountDeleteDialog());
    };

    const handleDeleteApprove = () => {
        if (!account) {
            return;
        }
        dispatch(deleteAccount(account.userName));
    };

    const handleDeleteCancel = () => {
        dispatch(closeAccountDeleteDialog());
    };

    // TODO: Should we let the user delete accounts that still owns buckets.
    return (
        <TableContainer>
            <DeleteConfirmation show={showDelete} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete account: ${account.userName} ?`}/>
            <ButtonContainer>
                <Button icon={<i className="fas fa-trash" />} onClick={handleDeleteClick} size="default" variant="danger" text='Delete Account' />
            </ButtonContainer>
            <h3>Account details</h3>
            <Table id='account-details-table'>
                <T.Body>
                    <T.Row>
                        <T.Key> Account ID </T.Key>
                        <T.Value> {account.id} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.id}/> </T.ExtraCell>
                    </T.Row>
                    <T.Row>
                        <T.Key> Name </T.Key>
                        <T.Value> {account.userName} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.userName}/> </T.ExtraCell>
                    </T.Row>
                    <T.Row>
                        <T.Key> Creation Date </T.Key>
                        <T.Value> {formatDate(new Date(account.createDate))} </T.Value>
                    </T.Row>
                    <T.Row>
                        <T.Key> Root User Email </T.Key>
                        <T.Value> {account.email} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.email}/> </T.ExtraCell>
                    </T.Row>
                    <T.Row>
                        <T.Key> Root User ARN </T.Key>
                        <T.Value> {account.arn} </T.Value>
                        <T.ExtraCell> <Clipboard text={account.arn}/> </T.ExtraCell>
                    </T.Row>
                </T.Body>
            </Table>
        </TableContainer>
    );
}

export default AccountInfo;
