// @flow
import { ContentSection, CreationSection } from '../ui-elements/ListLayout3';
import Table, * as T from '../ui-elements/TableKeyValue2';
import type { AppState } from '../../types/state';
import Configuration from './details/Configuration';
import { CustomTabs } from '../ui-elements/Tabs';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import Workflow from './workflow/Workflow';
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
                    <Table id=''>
                        <T.Body autoComplete='off'>
                            <T.Title> Create New Workflow </T.Title>
                            <T.Subtitle> All * are mandatory fields </T.Subtitle>
                            <Workflow loading={loading} workflow={null} locations={locations} createMode={true}/>
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
                locations={locations}
                wfSelected={wfSelected}
                loading={loading} />;
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
