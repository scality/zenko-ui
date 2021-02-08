// @noflow
import { Banner, Button } from '@scality/core-ui';
import React, { useMemo } from 'react';
import Table, * as T from '../../ui-elements/TableKeyValue2';
import type { BucketList } from '../../../stats';
import type { Locations } from '../../../config';
import Replication from '../replication/Replication';
import type { ReplicationStreams } from '../../../types/replication';
import type { Rule } from '../../../types/config';
import { deleteReplication } from '../../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const TableContainer = styled.div`
    display: flex;
    width: 100%;
`;

type Props = {
    ruleDetails: Rule,
    streams: ReplicationStreams,
    bucketList: BucketList,
    locations: Locations,
    showEditWorkflowNotification: boolean,
    loading: boolean,
};
function Configuration({ ruleDetails, streams, bucketList, locations, showEditWorkflowNotification }: Props) {
    const dispatch = useDispatch();

    const deleteWorkflow = (ruleDetails) => {
        dispatch(deleteReplication(ruleDetails));
    };
    const workflowDetails = useMemo(() => {
        return streams.find(s => s.streamId === ruleDetails.ruleId);
    }, [streams, ruleDetails]);

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
                        <Button icon={<i className="fas fa-trash" />} text="Delete Rule" variant='danger' onClick={() => deleteWorkflow(ruleDetails)} />
                    </T.Header>
                    <Replication showEditWorkflowNotification={showEditWorkflowNotification} workflowDetails={workflowDetails} streams={streams} bucketList={bucketList} locations={locations} createMode={false} />
                </T.Body>
            </Table>
        </TableContainer>
    );
}

export default Configuration;
