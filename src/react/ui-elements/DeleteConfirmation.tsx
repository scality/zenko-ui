/* eslint-disable */
import { Loader, Stack, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useSelector } from 'react-redux';
import { AppState } from '../../types/state';
import { CustomModal as Modal } from './Modal';
type Props = {
  approve: () => void;
  cancel: () => void;
  show: boolean;
  isLoading?: boolean;
  titleText: string;
};

const DeleteConfirmation = ({
  approve,
  cancel,
  show,
  titleText,
  isLoading,
}: Props) => {
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
        <Wrap>
          <p></p>
          <Stack>
            <Button variant="outline" onClick={cancel} label="Cancel" />
            <Button
              disabled={loading || isLoading}
              className="delete-confirmation-delete-button"
              variant="danger"
              onClick={() => approve()}
              icon={(isLoading || loading) && <Loader size="larger" />}
              label="Delete"
            />
          </Stack>
        </Wrap>
      }
      title="Confirmation"
    >
      {titleText}
    </Modal>
  );
};

export default DeleteConfirmation;
