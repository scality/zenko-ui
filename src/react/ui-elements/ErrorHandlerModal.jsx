// @noflow
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../types/actions';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import type { DispatchAPI } from 'redux';
import { CustomModal as Modal } from './Modal';
import React from 'react';
import { clearError } from '../actions';

const ErrorHandlerModal = () => {
    const showError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);
    const dispatch: DispatchAPI<Action> = useDispatch();

    const close = () => dispatch(clearError());

    if (!showError) {
        return null;
    }
    return (
        <Modal
            close={close}
            footer={<Button variant="primary" onClick={close} label="Close"/>}
            isOpen={true}
            title="Error">
            {errorMessage}
        </Modal>
    );
};

export default ErrorHandlerModal;
