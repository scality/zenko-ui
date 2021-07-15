// @flow
import { ContentSection, CreationSection } from '../ui-elements/ListLayout3';
import type { AppState } from '../../types/state';
import { CustomTabs } from '../ui-elements/Tabs';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import WorkflowEditor from './WorkflowEditor';
import type { Workflow as WorkflowRule } from '../../types/workflow';
import { useLocation } from 'react-router-dom';
import { useQuery } from '../utils/hooks';
import { useSelector } from 'react-redux';

export const SELECT_A_WORKFLOW_MESSAGE = 'Select a workflow.';

type Props = {
    wfSelected: ?WorkflowRule,
    createMode: boolean,
};

export const InfoWarning = ({ title }: { title: string}) => <Warning iconClass='fas fa-2x fa-info-circle' title={title} />;

function WorkflowContent({ createMode, wfSelected }: Props) {
    const query = useQuery();
    const { pathname } = useLocation();
    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);

    const tabName = query.get('tab');

    if (createMode) {
        return (
            <ContentSection>
                <CreationSection>
                    <WorkflowEditor loading={loading} wfSelected={null} locations={locations} createMode={true}/>
                </CreationSection>
            </ContentSection>
        );
    }

    const details = () => {
        if (!wfSelected) {
            return <InfoWarning title={SELECT_A_WORKFLOW_MESSAGE}/>;
        }
        if (!tabName) {
            return <WorkflowEditor locations={locations} wfSelected={wfSelected} createMode={false} loading={loading}/>;
        }
        return null;
    };

    return (
        <ContentSection>
            <CustomTabs>
                <CustomTabs.Tab label="Configuration" path={pathname}>
                    { details() }
                </CustomTabs.Tab>
            </CustomTabs>
        </ContentSection>
    );
}

export default WorkflowContent;
