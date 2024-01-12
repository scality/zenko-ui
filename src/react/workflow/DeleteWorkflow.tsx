import { Icon, Modal, Stack, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useState } from 'react';
import { UseFormReset } from 'react-hook-form';
import { BucketWorkflowTransitionV2 } from '../../js/managementClient/api';
import { Expiration, Replication } from '../../types/config';
import {
  initDefaultValues,
  isExpirationWorkflow,
  isTransitionWorkflow,
  useExpirationMutations,
  useReplicationMutations,
} from './ConfigurationTab';
import { convertToReplicationForm } from './utils';

export const DeleteWorkflow = ({
  workflow,
  reset,
}: {
  workflow: Replication | Expiration | BucketWorkflowTransitionV2;
  reset: UseFormReset<Expiration | BucketWorkflowTransitionV2>;
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { deleteExpirationMutation, editExpirationWorkflowMutation } =
    useExpirationMutations({
      onEditSuccess: (editedWorkflow) => {
        reset(
          initDefaultValues(
            editedWorkflow as Expiration | BucketWorkflowTransitionV2,
          ),
        );
      },
    });
  const { deleteReplicationMutation, editReplicationWorkflowMutation } =
    useReplicationMutations({
      onEditSuccess: (editedWorkflow) => {
        reset(convertToReplicationForm(editedWorkflow));
      },
    });

  const handleDeleteClick = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleDeleteWorkflow = () => {
    setIsModalOpen(false);
    if (workflow && isExpirationWorkflow(workflow)) {
      deleteExpirationMutation.mutate(workflow);
    } else if (workflow && isTransitionWorkflow(workflow)) {
      //   deleteTransitionMutation.mutate(workflow);
    } else {
      deleteReplicationMutation.mutate(workflow);
    }
  };

  return (
    <>
      <Button
        icon={<Icon name="Delete" />}
        label="Delete Workflow"
        variant="danger"
        onClick={handleDeleteClick}
        type="button"
      />
      <Modal
        close={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        footer={
          <Wrap>
            <p></p>
            <Stack>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                label="Cancel"
              />
              <Button
                className="delete-confirmation-delete-button"
                variant="danger"
                onClick={() => handleDeleteWorkflow()}
                label="Delete"
              />
            </Stack>
          </Wrap>
        }
        title="Confirmation"
      >
        {'Permanently remove the following Workflow'}
      </Modal>
    </>
  );
};
