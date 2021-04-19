// @flow
import { Banner, Button } from '@scality/core-ui';
import type { Locations, ReplicationStreams } from '../../../types/config';
import React, { useMemo } from 'react';
import Table, * as T from '../../ui-elements/TableKeyValue2';
import Replication from '../replication/Replication';
import type { S3BucketList } from '../../../types/s3';
import type { Workflow } from '../../../types/workflow';
import { deleteReplication } from '../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const TableContainer = styled.div`
    display: flex;
    width: 100%;
`;

type Props = {
    wfSelected: Workflow,
    replications: ReplicationStreams,
    bucketList: S3BucketList,
    locations: Locations,
    showEditWorkflowNotification: boolean,
    loading: boolean,
};
function Configuration({ wfSelected, replications, bucketList, locations, showEditWorkflowNotification, loading }: Props) {
    const dispatch = useDispatch();
    const { workflowId } = wfSelected;
    const replication = useMemo(() => {
        return replications.find(r => r.streamId === workflowId);
    }, [replications, workflowId]);

    const deleteWorkflow = (item) => {
        dispatch(deleteReplication(item));
    };

    // TODO: Adapt it to handle the other workflow types; For now only replication workflow is supported.
    return (
        <TableContainer>
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
                        <Button icon={<i className="fas fa-trash" />} text="Delete Workflow" variant='buttonDelete' onClick={() => deleteWorkflow(replication)} />
                    </T.Header>
                    <Replication loading={loading} replications={replications} showEditWorkflowNotification={showEditWorkflowNotification} workflow={replication} bucketList={bucketList} locations={locations} createMode={false} />
                </T.Body>
            </Table>
        </TableContainer>
    );
}

export default Configuration;
