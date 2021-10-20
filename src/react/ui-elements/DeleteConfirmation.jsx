/* eslint-disable */

import { Button } from '@scality/core-ui/dist/next';
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
      footer={
        <div>
          <Button variant="outline" onClick={cancel} label="Cancel" />
          <Button
            className="delete-confirmation-delete-button"
            variant="danger"
            onClick={() => approve()}
            label="Delete"
          />
        </div>
      }
      title="Confirmation"
    >
      {titleText}
    </Modal>
  );
};

export default DeleteConfirmation;
