import { Modal, Stack, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import styled from 'styled-components';

type VeeamSkipModalProps = {
  isOpen: boolean;
  close: () => void;
  exitAction: () => void;
  modalContent: JSX.Element;
  title?: string;
};

const ModalContent = styled.div`
  max-width: 30rem;
`;

export const VeeamSkipModal = ({
  isOpen,
  close,
  title = 'Exit Veeam assistant?',
  exitAction,
  modalContent,
}: VeeamSkipModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button
              variant="outline"
              onClick={() => {
                close();
              }}
              label="Cancel"
            />
            <Button
              variant="danger"
              onClick={() => {
                close();
                exitAction();
              }}
              label="Exit configuration"
            />
          </Stack>
        </Wrap>
      }
      title={title}
    >
      <ModalContent>{modalContent}</ModalContent>
    </Modal>
  );
};
