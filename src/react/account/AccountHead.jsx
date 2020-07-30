// @flow
import { Head, HeadCenter, HeadLeft, HeadRight, HeadTitle, IconCircle } from '../ui-elements/ListLayout';
import { closeAccountDeleteDialog, deleteAccount, openAccountDeleteDialog } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import React from 'react';

function AccountHead() {
    const dispatch = useDispatch();
    const account = useSelector((state: AppState) => state.account.display);
    const showDelete = useSelector((state: AppState) => state.uiAccount.showDelete);

    if (!account.id) {
        return <Head/>;
    }

    const handleDeleteClick = () => {
        dispatch(openAccountDeleteDialog());
    };

    const handleDeleteApprove = () => {
        dispatch(deleteAccount(account.userName));
    };

    const handleDeleteCancel = () => {
        dispatch(closeAccountDeleteDialog());
    };

    return (
        <Head>
            <DeleteConfirmation show={showDelete} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete account: ${account.userName} ?`}/>
            <HeadLeft> <IconCircle className="fas fa-wallet"></IconCircle> </HeadLeft>
            <HeadCenter>
                <HeadTitle> {account.userName} </HeadTitle>
            </HeadCenter>
            <HeadRight>
                <Button icon={<i className="fas fa-trash" />} onClick={handleDeleteClick} size="small" variant="danger" text='Delete account' />
            </HeadRight>
        </Head>
    );
}

export default AccountHead;
