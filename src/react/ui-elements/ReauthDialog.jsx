// @flow
import { loadClients, networkAuthReset } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import { CustomModal as Modal } from './Modal';
import React from 'react';
import { push } from 'connected-react-router';

const DEFAULT_MESSAGE = 'We need to log you in.';

const ReauthDialog = () => {
    const needReauth = useSelector((state: AppState) => state.networkActivity.authFailure);
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorType === 'byAuth' ? state.uiErrors.errorMsg : null);
    const pathname = useSelector((state: AppState) => state.router.location.pathname);

    const dispatch = useDispatch();

    const reauth = pathName => {
        dispatch(networkAuthReset());
        dispatch(loadClients()).then(() => dispatch(push(pathName)));
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
