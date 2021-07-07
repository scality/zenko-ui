// @flow
import Table, * as T from '../../ui-elements/TableKeyValue2';
import { closeWorkflowDeleteModal, deleteWorkflow, openWorkflowDeleteModal } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import DeleteConfirmation from '../../ui-elements/DeleteConfirmation';
import type { Locations } from '../../../types/config';
import React from 'react';
import Workflow from '../workflow/Workflow';
import type { Workflow as WorkflowRule } from '../../../types/workflow';
import styled from 'styled-components';

const TableContainer = styled.div`
    display: flex;
    width: 100%;
`;

type Props = {
    wfSelected: WorkflowRule,
    locations: Locations,
    loading: boolean,
};
function Configuration({ wfSelected, locations, loading }: Props) {
    const dispatch = useDispatch();
    const { showEditWorkflowNotification } = useSelector((state: AppState) => state.uiWorkflows);
    const isDeleteModalOpen = useSelector((state: AppState) => state.uiWorkflows.showWorkflowDeleteModal);

    const handleOpenDeleteModal = () => {
        dispatch(openWorkflowDeleteModal());
    };

    const handleDeleteWorkflow = () => {
        dispatch(deleteWorkflow(wfSelected));
    };

    const handleCloseDeleteModal = () => {
        dispatch(closeWorkflowDeleteModal());
    };

    return (
        <TableContainer>
            <DeleteConfirmation approve={ handleDeleteWorkflow } cancel={ handleCloseDeleteModal } show={ isDeleteModalOpen } titleText={ `Permanently remove the following Rule: ${ wfSelected.name } ?` }/>
            <Table id=''>
                <T.Body autoComplete='off'>
                    <T.Header>
                        <T.BannerContainer isHidden={!showEditWorkflowNotification}>
                            <Banner
                                icon={<i className="fas fa-exclamation-triangle" />}
                                variant="warning"
                            >
                                If you leave this screen without saving, your changes will be lost.
                            </Banner>
                        </T.BannerContainer>
                        <Button icon={<i className="fas fa-trash" />} label="Delete Workflow" variant='danger' onClick={handleOpenDeleteModal} />
                    </T.Header>
                    <Workflow loading={loading} workflow={wfSelected} locations={locations} createMode={false}/>
                </T.Body>
            </Table>
        </TableContainer>
    );
}

export default Configuration;
