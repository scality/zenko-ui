/* eslint-disable */
import { Loader, Stack, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useIsMutating } from 'react-query';
import { CustomModal as Modal } from './Modal';
type Props = {
  approve: () => void;
  cancel: () => void;
  show: boolean;
  isLoading?: boolean;
  titleText: React.ReactNode;
};

const DeleteConfirmation = ({
  approve,
  cancel,
  show,
  titleText,
  isLoading,
}: Props) => {
  const isMutating = useIsMutating();
  const loading = isMutating > 0;

  if (!show) {
    return null;
  }

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
              isLoading={isLoading}
              label={isLoading ? 'Deleting...' : 'Delete'}
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
