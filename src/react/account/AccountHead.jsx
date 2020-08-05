// @flow
import { Head, HeadCenter, HeadLeft, HeadRight, HeadTitle, IconCircle } from '../ui-elements/ListLayout';
import { closeAccountDeleteDialog, deleteAccount, openAccountDeleteDialog } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import React from 'react';
import { useParams } from 'react-router-dom';

function AccountHead() {
    const dispatch = useDispatch();
    const { accountName: accountNameParams } = useParams();
    const showDelete = useSelector((state: AppState) => state.uiAccount.showDelete);

    if (!accountNameParams) {
        return <Head/>;
    }

    const handleDeleteClick = () => {
        dispatch(openAccountDeleteDialog());
    };

    const handleDeleteApprove = () => {
        dispatch(deleteAccount(accountNameParams));
    };

    const handleDeleteCancel = () => {
        dispatch(closeAccountDeleteDialog());
    };

    return (
        <Head>
            <DeleteConfirmation show={showDelete} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete account: ${accountNameParams} ?`}/>
            <HeadLeft> <IconCircle className="fas fa-wallet"></IconCircle> </HeadLeft>
            <HeadCenter>
                <HeadTitle> {accountNameParams} </HeadTitle>
            </HeadCenter>
            <HeadRight>
                <Button icon={<i className="fas fa-trash" />} onClick={handleDeleteClick} size="small" variant="danger" text='Delete account' />
            </HeadRight>
        </Head>
    );
}

export default AccountHead;
