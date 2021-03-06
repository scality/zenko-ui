// @flow
import { ContentSection, CreationSection } from '../ui-elements/ListLayout3';
import Table, * as T from '../ui-elements/TableKeyValue2';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import Configuration from './details/Configuration';
import { CustomTabs } from '../ui-elements/Tabs';
import React from 'react';
import Replication from './replication/Replication';
import type { S3BucketList } from '../../types/s3';
import { Warning } from '../ui-elements/Warning';
import type { Workflow } from '../../types/workflow';
import { push } from 'connected-react-router';
import { useLocation } from 'react-router-dom';
import { useQuery } from '../utils/hooks';

export const SELECT_A_WORKFLOW_MESSAGE = 'Select a workflow.';

type Props = {
    wfSelected: ?Workflow,
    createMode: boolean,
    bucketList: S3BucketList,
};

export const InfoWarning = ({ title }: { title: string}) => <Warning iconClass='fas fa-2x fa-info-circle' title={title} />;

function WorkflowContent({ createMode, wfSelected, bucketList }: Props) {
    const dispatch = useDispatch();
    const query = useQuery();
    const { pathname } = useLocation();
    const replications = useSelector((state: AppState) => state.workflow.replications);
    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const showEditWorkflowNotification = useSelector((state: AppState) => state.uiWorkflows.showEditWorkflowNotification);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);
    const theme = useSelector((state: AppState) => state.uiConfig.theme);

    const tabName = query.get('tab');

    if (createMode) {
        return (
            <ContentSection>
                <CreationSection>
                    <Table id=''>
                        <T.Body autoComplete='off'>
                            <T.Title> Create New Workflow </T.Title>
                            <T.Subtitle> All * are mandatory fields </T.Subtitle>
                            <Replication loading={loading} showEditWorkflowNotification={false} workflow={null} replications={replications} bucketList={bucketList} locations={locations} createMode={true} />
                        </T.Body>
                    </Table>
                </CreationSection>
            </ContentSection>
        );
    }

    const details = () => {
        if (!wfSelected) {
            return <InfoWarning title={SELECT_A_WORKFLOW_MESSAGE}/>;
        }
        if (!tabName) {
            return <Configuration
                showEditWorkflowNotification={showEditWorkflowNotification}
                replications={replications}
                bucketList={bucketList}
                locations={locations}
                wfSelected={wfSelected}
                loading={loading} />;
        }
        return null;
    };

    return (
        <ContentSection>
            <CustomTabs
                activeTabColor={ theme.brand.backgroundLevel4 }
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
