import {
  Banner,
  BasicText,
  Checkbox,
  Icon,
  Loader,
  Modal,
  Stack,
  Text,
  Wrap,
} from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useCallback, useMemo, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import {
  BucketWorkflowExpirationV1,
  BucketWorkflowTransitionV2,
} from '../../js/managementClient/api';
import { Expiration, Replication } from '../../types/config';
import { APIWorkflows } from '../../types/workflow';
import { isExpirationWorkflow, isTransitionWorkflow } from './ConfigurationTab';
import { useWorkflowsWithSelect } from './Workflows';
import { WorkflowRule, useDeleteWorkflow } from './useDeleteWorkflow';
import {
  generateExpirationName,
  generateStreamName,
  generateTransitionName,
} from './utils';

const ModalContent = styled.div`
  max-width: 39.625rem;
`;

type WorkflowType = Replication | Expiration | BucketWorkflowTransitionV2;

const getWorflowName = (workflow: WorkflowType) => {
  return (
    workflow.name ||
    (isExpirationWorkflow(workflow)
      ? generateExpirationName(workflow as BucketWorkflowExpirationV1)
      : isTransitionWorkflow(workflow)
      ? generateTransitionName(workflow)
      : generateStreamName(workflow))
  );
};

const getWorkflowType = (workflow: WorkflowType) => {
  return isTransitionWorkflow(workflow)
    ? WorkflowRule.Transition
    : isExpirationWorkflow(workflow)
    ? WorkflowRule.Expiration
    : WorkflowRule.Replication;
};

export function useWorkflowsFilteredByBucketName(
  bucketNameFilter?: string,
  filters?: string[],
) {
  const workflowsResult = useWorkflowsWithSelect(
    (workflows: APIWorkflows) => ({
      replications: workflows
        .filter((w) => w.replication)
        .map((w) => w.replication),
      expirations: workflows
        .filter((w) => w.expiration)
        .map((w) => w.expiration),
      transitions: workflows
        .filter((w) => w.transition)
        .map((w) => w.transition),
    }),
    filters,
  );

  const filteredReplicationWorkflows = useMemo(() => {
    if (bucketNameFilter && workflowsResult.data) {
      return workflowsResult.data.replications.filter(
        (replication: Replication) => {
          return replication.source?.bucketName === bucketNameFilter;
        },
      );
    }
    return [];
  }, [workflowsResult.data, bucketNameFilter]);

  return {
    ...workflowsResult,
    data: filteredReplicationWorkflows,
  };
}

export const DeleteWorkflowButton = ({
  workflow,
}: {
  workflow: WorkflowType;
}) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [checked, setChecked] = useState(false);

  const theme = useTheme();

  const { data: workflows, isLoading } = useWorkflowsFilteredByBucketName(
    (workflow as Replication)?.source?.bucketName,
  );

  const worflowType = useMemo(() => getWorkflowType(workflow), [workflow]);
  const { mutate, isLoading: mutationLoading } = useDeleteWorkflow(
    worflowType,
    setOpenDeleteModal,
  );

  const workflowNames = useMemo(
    () =>
      workflows.length
        ? workflows.map((wf) => getWorflowName(wf))
        : [getWorflowName(workflow)],
    [workflows],
  );

  const handleDeleteWorkflow = useCallback(() => {
    mutate(workflow);
  }, [workflow]);

  return (
    <>
      <Button
        disabled={isLoading}
        icon={isLoading ? <Loader size="larger" /> : <Icon name="Delete" />}
        label="Delete Workflow"
        variant="danger"
        onClick={() => setOpenDeleteModal(true)}
        type="button"
      />
      <Modal
        close={() => setOpenDeleteModal(false)}
        isOpen={openDeleteModal}
        footer={
          <Wrap>
            <p></p>
            <Stack>
              <Button
                variant="outline"
                onClick={() => setOpenDeleteModal(false)}
                label="Cancel"
              />
              <Button
                disabled={!checked || mutationLoading}
                aria-label="delete-confirmation-delete-button"
                variant="danger"
                onClick={() => handleDeleteWorkflow()}
                icon={mutationLoading && <Loader size="larger" />}
                label="Delete"
              />
            </Stack>
          </Wrap>
        }
        title="Confirmation"
      >
        <ModalContent>
          <Banner
            variant="warning"
            icon={
              <Icon name="Exclamation-triangle" color={theme.statusWarning} />
            }
          >
            <BasicText>
              When the same bucket is the source of multiple Replication
              Workflows, deleting any one of them will result in the
              simultaneous removal of all related workflows.
            </BasicText>
          </Banner>
          <br />
          <Text>{`Permanently delete the following workflows?`}</Text>
          <ul>
            {workflowNames.map((workflowName, i) => (
              <li key={i} style={{ padding: 4 }}>
                {workflowName}
              </li>
            ))}
          </ul>
          <br />
          <Checkbox
            id="delete-workflow-checkbox"
            checked={checked}
            label={'I want to delete these workflows'}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </ModalContent>
      </Modal>
    </>
  );
};
