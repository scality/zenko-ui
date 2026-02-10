import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { Wrap } from '@scality/core-ui/dist/spacing';
import type { JSX } from 'react';
import { useModalError } from '../ErrorProvider';
import { CustomModal as Modal } from './Modal';

const ErrorHandlerModal = () => {
  const { modalError, clearModalError } = useModalError();

  if (!modalError) {
    return null;
  }

  return <DumbErrorModal errorMessage={modalError} isOpen={true} close={clearModalError} />;
};

export const DumbErrorModal = ({
  close,
  isOpen,
  errorMessage,
}: {
  close: () => void;
  isOpen: boolean;
  errorMessage: string | JSX.Element | null;
}) => (
  <Modal
    close={close}
    footer={
      <Wrap>
        <p></p>
        <Button variant="primary" onClick={close} label="Close" />
      </Wrap>
    }
    isOpen={isOpen}
    title="Error"
  >
    {errorMessage}
  </Modal>
);

export default ErrorHandlerModal;
