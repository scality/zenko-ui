// @noflow

import { Button } from '@scality/core-ui';
import { CustomModal as Modal } from './Modal';
import type { Node } from 'react';
import React from 'react';

type Props = {
    children: Node,
    close: () => void,
    show: boolean,
};

const ErrorHandlerModal = ({ children, close, show }: Props) => {
    if (!children) {
        return null;
    }
    return (
        <Modal
            close={close}
            footer={<div> <Button outlined onClick={close} size="small" text="Close"/> </div>}
            isOpen={show}
            title="Error">
            <div style={{ margin: '10px 0px 20px' }}>
                {children}
            </div>
        </Modal>
    );
};

export default ErrorHandlerModal;
