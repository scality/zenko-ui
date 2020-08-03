// @flow
import { Button, Modal } from '@scality/core-ui';
import { networkAuthReset, signin, signout } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../types/actions';
import type { AppState } from '../../types/state';
import type { DispatchAPI } from 'redux';
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
            close={logout}
            footer={<div style={{ display: 'flex', justifyContent: 'flex-end' }}> <Button outlined onClick={() => reauth(pathname)} size="small" text={ errorMessage ? 'Retry' : 'Reload' }/> </div>}
            isOpen={true}
            title='Authentication Error'>
            <div style={{ margin: '10px 0px 20px' }}>
                { errorMessage || DEFAULT_MESSAGE }
            </div>
        </Modal>
    );
};

export default ReauthDialog;
