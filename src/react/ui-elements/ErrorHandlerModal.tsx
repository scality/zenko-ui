// @noflow
import { Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useDispatch, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import type { Action } from '../../types/actions';
import type { AppState } from '../../types/state';
import { clearError } from '../actions';
import { CustomModal as Modal } from './Modal';

const ErrorHandlerModal = () => {
  const showError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const dispatch: Dispatch<Action> = useDispatch();

  const close = () => dispatch(clearError());

  if (!showError) {
    return null;
  }

  return (
    <DumbErrorModal errorMessage={errorMessage} isOpen={true} close={close} />
  );
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
