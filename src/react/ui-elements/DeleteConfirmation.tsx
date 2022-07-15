/* eslint-disable */
import { Loader } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useSelector } from 'react-redux';
import { AppState } from '../../types/state';
import { CustomModal as Modal } from './Modal';
type Props = {
  approve: () => void;
  cancel: () => void;
  show: boolean;
  titleText: string;
};

const DeleteConfirmation = ({ approve, cancel, show, titleText }: Props) => {
  if (!show) {
    return null;
  }

  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  return (
    <Modal
      close={cancel}
      isOpen={true}
      footer={
        <div>
          <Button variant="outline" onClick={cancel} label="Cancel" />
          <Button
            disabled={loading}
            className="delete-confirmation-delete-button"
            variant="danger"
            onClick={() => approve()}
            icon={loading && <Loader size="larger" />}
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
