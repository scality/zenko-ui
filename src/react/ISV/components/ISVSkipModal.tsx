import { Modal, Stack, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import type { ReactNode } from 'react';
import styled from 'styled-components';

type ISVSkipModalProps = {
  isOpen: boolean;
  close: () => void;
  exitAction: () => void;
  modalContent: ReactNode;
  title: string;
};

const ModalContent = styled.div`
  max-width: 30rem;
`;

export const ISVSkipModal = ({ isOpen, close, title, exitAction, modalContent }: ISVSkipModalProps) => {
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
