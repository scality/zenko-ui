// @flow
import { networkAuthReset, signin, signout } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../types/actions';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import type { DispatchAPI } from 'redux';
import { CustomModal as Modal } from './Modal';
import React from 'react';

const DEFAULT_MESSAGE = 'We need to log you in.';

const ReauthDialog = () => {
    const needReauth = useSelector((state: AppState) => state.networkActivity.authFailure);
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

    if (!needReauth) {
        return null;
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
