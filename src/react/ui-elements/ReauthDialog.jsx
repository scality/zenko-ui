// @flow
import { S3_FAILURE_TYPE, networkAuthReset, signin, signout } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../types/actions';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import type { DispatchAPI } from 'redux';
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

    const dispatch: DispatchAPI<Action> = useDispatch();

    const reauth = pathname => {
        dispatch(networkAuthReset());
        dispatch(signin(pathname));
    };

    const logout = () => {
        dispatch(signout());
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
                        <Button variant="danger" onClick={() => reauth(pathname)} size="small" text='Retry'/>
                        <Button variant="secondary" onClick={() => s3Close()} size="small" text='Back to my buckets' />
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
                    <Button variant="danger" onClick={() => logout()} size="small" text="Log out"/>
                    <Button variant="secondary" onClick={() => reauth(pathname)} size="small" text={ errorMessage ? 'Retry' : 'Reload' }/>
                </div>
            }
            isOpen={true}
            title='Authentication Error'>
            { errorMessage || DEFAULT_MESSAGE }
        </Modal>
    );
};

export default ReauthDialog;
