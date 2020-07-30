/* eslint-disable */

import { Button } from '@scality/core-ui';
import { CustomModal as Modal } from './Modal';
import React from 'react';

type Props = {
    approve: () => void,
    cancel: () => void,
    show: boolean,
    titleText: string,
};

const DeleteConfirmation = ({ approve, cancel, show, titleText }: Props) => {
    if (!show) {
        return null;
    }
    return (
        <Modal
            close={cancel}
            isOpen={true}
            footer={<div><Button variant="secondary" onClick={cancel} size="small" text="Cancel"/><Button variant="danger" onClick={() => approve()} size="small" text="Delete"/></div>}
            title='Confirmation'>
            {titleText}
        </Modal>
    );
};

export default DeleteConfirmation;
