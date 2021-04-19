// @noflow
import { Banner, Button } from '@scality/core-ui';
import Table, * as T from '../../ui-elements/TableKeyValue2';
import type { Locations } from '../../../config';
import React from 'react';
import Replication from '../replication/Replication';
import type { ReplicationStreams } from '../../../types/replication';
import type { S3BucketList } from '../../../s3';
import type { Workflow } from '../../types/workflow';
import { deleteReplication } from '../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const TableContainer = styled.div`
    display: flex;
    width: 100%;
`;

type Props = {
    wfSelected: Workflow,
    streams: ReplicationStreams,
    bucketList: S3BucketList,
    locations: Locations,
    showEditWorkflowNotification: boolean,
    loading: boolean,
};
function Configuration({ wfSelected, streams, bucketList, locations, showEditWorkflowNotification }: Props) {
    const dispatch = useDispatch();

    const { item } = wfSelected;

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
                        <Button icon={<i className="fas fa-trash" />} text="Delete Workflow" variant='danger' onClick={() => deleteWorkflow(item)} />
                    </T.Header>
                    <Replication showEditWorkflowNotification={showEditWorkflowNotification} workflow={item} streams={streams} bucketList={bucketList} locations={locations} createMode={false} />
                </T.Body>
            </Table>
        </TableContainer>
    );
}

export default Configuration;
