// @flow
import { S3_FAILURE_TYPE, loadClients, networkAuthReset } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import { CustomModal as Modal } from './Modal';
import React from 'react';
import { push } from 'connected-react-router';

const DEFAULT_MESSAGE = 'We need to log you in.';
const DEFAULT_S3_MESSAGE = 'Make sure you are using the right S3 account.';

const ReauthDialog = () => {
    const needReauth = useSelector((state: AppState) => state.networkActivity.authFailure);
    const failureType = useSelector((state: AppState) => state.networkActivity.failureType);
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorType === 'byAuth' ? state.uiErrors.errorMsg : null);
    const pathname = useSelector((state: AppState) => state.router.location.pathname);

    const dispatch = useDispatch();

    const reauth = pathName => {
        dispatch(networkAuthReset());
        dispatch(loadClients()).then(() => dispatch(push(pathName)));
    };

    const s3Close = () => {
        dispatch(networkAuthReset());
        dispatch(push('/buckets'));
    };

    if (!needReauth) {
        return null;
    }

    if (failureType === S3_FAILURE_TYPE) {
        return (
            <Modal
                id="reauth-s3-dialog-modal"
                close={() => s3Close()}
                footer={
                    <div>
                        <Button variant="buttonDelete" onClick={() => reauth(pathname)} size="small" text='Retry'/>
                        <Button variant="buttonPrimary" onClick={() => s3Close()} size="small" text='Back to my buckets' />
                    </div>
                }
                isOpen={true}
                title='S3 Authentication Error'>
                { errorMessage || DEFAULT_S3_MESSAGE }
            </Modal>
        );
    }

    return (
        <Modal
            id="reauth-dialog-modal"
            close={() => reauth(pathname)}
            footer={
                <div>
                    <Button variant="buttonPrimary" onClick={() => reauth(pathname)} size="small" text={ errorMessage ? 'Retry' : 'Reload' }/>
                </div>
            }
            isOpen={true}
            title='Authentication Error'>
            { errorMessage || DEFAULT_MESSAGE }
        </Modal>
    );
};

export default ReauthDialog;
