import type { Locations, ReplicationStreams } from '../../../types/config';
import React, { useMemo } from 'react';
import Table, * as T from '../../ui-elements/TableKeyValue2';
import {
  closeWorkflowDeleteModal,
  deleteReplication,
  openWorkflowDeleteModal,
} from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import DeleteConfirmation from '../../ui-elements/DeleteConfirmation';
import Replication from '../replication/Replication';
import type { S3BucketList } from '../../../types/s3';
import type { Workflow } from '../../../types/workflow';
import styled from 'styled-components';
const TableContainer = styled.div`
  display: flex;
  width: 100%;
`;
type Props = {
  wfSelected: Workflow;
  replications: ReplicationStreams;
  bucketList: S3BucketList;
  locations: Locations;
  showEditWorkflowNotification: boolean;
  loading: boolean;
};

function Configuration({
  wfSelected,
  replications,
  bucketList,
  locations,
  showEditWorkflowNotification,
  loading,
}: Props) {
  const dispatch = useDispatch();
  const { workflowId } = wfSelected;
  const isDeleteModalOpen = useSelector(
    (state: AppState) => state.uiWorkflows.showWorkflowDeleteModal,
  );
  const replication = useMemo(() => {
    return replications.find((r) => r.streamId === workflowId);
  }, [replications, workflowId]);

  const handleOpenDeleteModal = () => {
    dispatch(openWorkflowDeleteModal());
  };

  const handleCloseDeleteModal = () => {
    dispatch(closeWorkflowDeleteModal());
  };

  const handleDeleteWorkflow = () => {
    dispatch(deleteReplication(replication));
  };

  // TODO: Adapt it to handle the other workflow types; For now only replication workflow is supported.
  return (
    <TableContainer>
      <DeleteConfirmation
        approve={handleDeleteWorkflow}
        cancel={handleCloseDeleteModal}
        show={isDeleteModalOpen}
        titleText={`Permanently remove the following Rule: ${wfSelected.name} ?`}
      />
      <Table id="">
        <T.Body autoComplete="off">
          <T.Header>
            <T.BannerContainer isHidden={!showEditWorkflowNotification}>
              <Banner
                icon={<i className="fas fa-exclamation-triangle" />}
                variant="warning"
              >
                If you leave this screen without saving, your changes will be
                lost.
              </Banner>
            </T.BannerContainer>
            <Button
              icon={<i className="fas fa-trash" />}
              label="Delete Workflow"
              variant="danger"
              onClick={handleOpenDeleteModal}
              type="button"
            />
          </T.Header>
          <Replication
            loading={loading}
            replications={replications}
            showEditWorkflowNotification={showEditWorkflowNotification}
            workflow={replication}
            bucketList={bucketList}
            locations={locations}
            createMode={false}
          />
        </T.Body>
      </Table>
    </TableContainer>
  );
}

export default Configuration;