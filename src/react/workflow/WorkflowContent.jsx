// @flow
import { ContentSection, CreationSection } from '../ui-elements/ListLayout3';
import Table, * as T from '../ui-elements/TableKeyValue2';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import Configuration from './details/Configuration';
import { CustomTabs } from '../ui-elements/Tabs';
import React from 'react';
import Replication from './replication/Replication';
import type { Rule } from '../../types/config';
import type { S3BucketList } from '../../types/s3';
import { Title } from '../ui-elements/FormLayout';
import { Warning } from '../ui-elements/Warning';
import { push } from 'connected-react-router';
import { useLocation } from 'react-router-dom';
import { useQuery } from '../utils/hooks';

export const SELECT_A_RULE_MESSAGE = 'Select a rule.';

type Props = {
    ruleDetails: ?Rule,
    createMode: boolean,
    bucketList: S3BucketList,
};

export const InfoWarning = ({ title }: { title: string}) => <Warning iconClass='fas fa-2x fa-info-circle' title={title} />;

function WorkflowContent({ createMode, ruleDetails, bucketList }: Props) {
    const dispatch = useDispatch();
    const query = useQuery();
    const { pathname } = useLocation();
    const streams = useSelector((state: AppState) => state.configuration.latest.replicationStreams);
    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const showEditWorkflowNotification = useSelector((state: AppState) => state.uiWorkflows.showEditWorkflowNotification);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);

    const tabName = query.get('tab');

    const details = () => {
        if (!ruleDetails) {
            return <InfoWarning title={SELECT_A_RULE_MESSAGE}/>;
        }
        if (!tabName) {
            return <Configuration
                showEditWorkflowNotification={showEditWorkflowNotification}
                streams={streams}
                bucketList={bucketList}
                locations={locations}
                ruleDetails={ruleDetails}
                loading={loading} />;
        }
        return null;
    };

    if (createMode) {
        return (
            <ContentSection>
                <CreationSection>
                    <Table id=''>
                        <T.Body autoComplete='off'>
                            <Title> create new rule </Title>
                            <Replication loading={loading} showEditWorkflowNotification={false} workflowDetails={null} streams={streams} bucketList={bucketList} locations={locations} createMode={true} />
                        </T.Body>
                    </Table>
                </CreationSection>
            </ContentSection>
        );
    }

    return (
        <ContentSection>
            <CustomTabs
                items={[
                    {
                        onClick: () => dispatch(push(pathname)),
                        selected: !tabName,
                        title: 'Configuration',
                    },
                ]}
            >
                { details() }
            </CustomTabs>
        </ContentSection>
    );
}

export default WorkflowContent;
