// @flow
import { HeadCenter, HeadLeft, HeadRight, HeadTitle, IconCircle } from '../ui-elements/ListLayout';
import { closeAccountDeleteDialog, deleteAccount, openAccountDeleteDialog } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Account } from '../../types/account';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    width: 100%;
`;

type Props = {
    account: ?Account,
};

function AccountHead({ account }: Props) {
    const dispatch = useDispatch();
    const showDelete = useSelector((state: AppState) => state.uiAccount.showDelete);

    if (!account || !account.userName) {
        return null;
    }

    const accountName = account.userName;

    const handleDeleteClick = () => {
        dispatch(openAccountDeleteDialog());
    };

    const handleDeleteApprove = () => {
        dispatch(deleteAccount(accountName));
    };

    const handleDeleteCancel = () => {
        dispatch(closeAccountDeleteDialog());
    };

    return (
        <Container>
            <DeleteConfirmation show={showDelete} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete account: ${accountName} ?`}/>
            <HeadLeft> <IconCircle className="fas fa-wallet"></IconCircle> </HeadLeft>
            <HeadCenter>
                <HeadTitle> {accountName} </HeadTitle>
            </HeadCenter>
            <HeadRight>
                <Button icon={<i className="fas fa-trash" />} onClick={handleDeleteClick} size="small" variant="danger" text='Delete account' />
            </HeadRight>
        </Container>
    );
}

export default AccountHead;
