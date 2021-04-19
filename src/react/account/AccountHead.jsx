// @flow
import { Head, HeadCenter, HeadLeft, HeadRight, HeadTitle, IconCircle } from '../ui-elements/ListLayout';
import { closeAccountDeleteDialog, deleteAccount, openAccountDeleteDialog } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Account } from '../../types/account';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import React from 'react';
import { useParams } from 'react-router-dom';

type Props = {
    account: ?Account,
};

function AccountHead({ account }: Props) {
    const dispatch = useDispatch();
    const showDelete = useSelector((state: AppState) => state.uiAccounts.showDelete);

    const { accountName: accountNameParam } = useParams();

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
        <Head>
            { !!account && <DeleteConfirmation show={showDelete} cancel={handleDeleteCancel} approve={handleDeleteApprove} titleText={`Are you sure you want to delete account: ${account.userName} ?`}/> }
            <HeadLeft> <IconCircle className="fas fa-wallet"></IconCircle> </HeadLeft>
            <HeadCenter>
                <HeadTitle> {accountNameParam} </HeadTitle>
            </HeadCenter>
            <HeadRight>
                { !!account && <Button icon={<i className="fas fa-trash" />} onClick={handleDeleteClick} size="default" variant="buttonDelete" text='Delete Account' /> }
            </HeadRight>
        </Head>
    );
}

export default AccountHead;
