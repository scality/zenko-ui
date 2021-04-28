// @flow
import type { Account, AccountKey } from '../../../../types/account';
import { Banner, Button } from '@scality/core-ui';
import { CustomModal as Modal, ModalBody } from '../../../ui-elements/Modal';
import Table, * as T from '../../../ui-elements/TableKeyValue';
import { closeAccountKeyCreateModal, createAccountAccessKey, deleteAccountSecret } from '../../../actions/account';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../../types/state';
import { Clipboard } from '../../../ui-elements/Clipboard';
import { HideCredential } from '../../../ui-elements/Hide';
import React from 'react';

type Props = {
    account: Account,
};

function SecretKeyModal({ account }: Props) {
    const dispatch = useDispatch();
    const accountKey = useSelector((state: AppState) => state.secrets.accountKey);
    const isModalOpen = useSelector((state: AppState) => state.uiAccounts.showKeyCreate);

    const handleClose = () => {
        dispatch(deleteAccountSecret());
        dispatch(closeAccountKeyCreateModal());
    };

    const handleAccessKeyCreate = () => {
        dispatch(createAccountAccessKey(account.userName));
    };

    if (!isModalOpen) {
        return null;
    }

    const modalFooter = (key: AccountKey | null) => {
        const isFirstModal = key === null;
        if (isFirstModal) {
            return <div>
                <Button outlined onClick={handleClose} text='Cancel' />
                <Button
                    icon={<i className="fas fa-arrow-right" />}
                    variant="buttonPrimary"
                    size="default"
                    onClick={handleAccessKeyCreate}
                    text='Continue'/>
            </div>;
        }
        return <Button onClick={handleClose} variant="buttonPrimary" text='Close' />;
    };

    return (
        <Modal
            close={handleClose}
            footer={modalFooter(accountKey)}
            isOpen={true}
            title='Create Root user Access keys'>
            { modalBody(accountKey) }
        </Modal>
    );
}

const modalBody = (key: AccountKey | null) => {
    if (key === null) {
        return <ModalBody>
            A Root user Access key ID and its Secret Access key will be created. <br/>
            Note: <br/>
            - the Secret Access key will be visible only at this step, <br/>
            - Root user Access keys provide unrestricted access to the account resources.
        </ModalBody>;
    }
    return <ModalBody>
        <Banner
            icon={<i className="fas fa-exclamation-triangle" />}
            variant="warning"
        >
            A Root user Access key ID and its Secret Access key have been created. <br/>
            The Secret Access key cannot be retrieved afterwards, so make sure to keep and secure it now. <br/>
            You will be able to create new Access keys at any time.
        </Banner>
        <Table style={{ marginTop: '16px' }}>
            <T.Body>
                <T.Row>
                    <T.Key> Account name </T.Key>
                    <T.Value> {key.accountName} </T.Value>
                </T.Row>
                <T.Row>
                    <T.Key> Access key ID </T.Key>
                    <T.Value> { key.accessKey } </T.Value>
                    <T.ExtraCell> <Clipboard text={ key.accessKey }/> </T.ExtraCell>
                </T.Row>
                <T.Row>
                    <T.Key> Secret Access key </T.Key>
                    <T.Value> <HideCredential>  { key.secretKey } </HideCredential> </T.Value>
                    <T.ExtraCell> <Clipboard text={ key.secretKey }/> </T.ExtraCell>
                </T.Row>
            </T.Body>
        </Table>
    </ModalBody>;
};

export default SecretKeyModal;
