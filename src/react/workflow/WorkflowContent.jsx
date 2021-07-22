// @flow
import { ContentSection, CreationSection } from '../ui-elements/ListLayout3';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { CustomTabs } from '../ui-elements/Tabs';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import type { Workflow } from '../../types/workflow';
import WorkflowEditor from './WorkflowEditor';
import { push } from 'connected-react-router';
import { useLocation } from 'react-router-dom';
import { useQuery } from '../utils/hooks';

export const SELECT_A_WORKFLOW_MESSAGE = 'Select a workflow.';

type Props = {
    wfSelected: ?Workflow,
    createMode: boolean,
};

export const InfoWarning = ({ title }: { title: string}) => <Warning iconClass='fas fa-2x fa-info-circle' title={title} />;

function WorkflowContent({ createMode, wfSelected }: Props) {
    const dispatch = useDispatch();
    const query = useQuery();
    const { pathname } = useLocation();
    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);
    const theme = useSelector((state: AppState) => state.uiConfig.theme);

    const tabName = query.get('tab');

    if (createMode) {
        return (
            <ContentSection>
                <CreationSection>
                    <WorkflowEditor createMode={true} wfSelected={null} loading={loading} locations={locations}/>
                </CreationSection>
            </ContentSection>
        );
    }

    const details = () => {
        if (!wfSelected) {
            return <InfoWarning title={SELECT_A_WORKFLOW_MESSAGE}/>;
        }
        if (!tabName) {
            return <WorkflowEditor createMode={false} wfSelected={wfSelected} loading={loading} locations={locations}/>;
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
