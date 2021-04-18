// @flow
import * as L from '../ui-elements/ListLayout3';
import { Redirect, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { BreadcrumbWorkflow } from '../ui-elements/Breadcrumb';
import { EmptyStateContainer } from '../ui-elements/Container';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import WorkflowContent from './WorkflowContent';
import WorkflowList from './WorkflowList';
import { push } from 'connected-react-router';

export default function Workflows(){
    const dispatch = useDispatch();
    const { workflowId } = useParams();
    const { pathname } = useLocation();
    const workflows = useSelector((state: AppState) => state.workflow.list);
    const createMode = pathname === '/create-workflow';
    const accountName = useSelector((state: AppState) => state.auth.selectedAccount && state.auth.selectedAccount.userName);
    const accounts = useSelector((state: AppState) => state.configuration.latest.users);
    const bucketList = useSelector((state: AppState) => state.s3.listBucketsResults.list);

    if (accounts.length === 0) {
        return <EmptyStateContainer>
            <Warning
                centered={true}
                iconClass="fas fa-5x fa-wallet"
                title='Before browsing your workflow rules, create your first account.'
                btnTitle='Create Account'
                btnAction={() => dispatch(push('/create-account'))} />
        </EmptyStateContainer>;
    }

    const content = () => {
        if (bucketList.size === 0) {
            return <EmptyStateContainer>
                <Warning
                    centered={true}
                    iconClass="fas fa-5x fa-wallet"
                    title='Before browsing your workflow rules, create your first bucket.'
                    btnTitle='Create Bucket'
                    btnAction={() => dispatch(push('/create-bucket'))} />
            </EmptyStateContainer>;
        }
        if (!createMode && workflows.length === 0) {
            return <EmptyStateContainer>
                <Warning
                    centered={true}
                    iconClass="fas fa-5x fa-wallet"
                    title='Before browsing your workflow rules, create your first rule.'
                    btnTitle='Create Rule'
                    btnAction={() => dispatch(push('/create-workflow'))} />
            </EmptyStateContainer>;
        }
        // redirect to the first workflow.
        if (!createMode && workflows.length > 0 && !workflowId) {
            return <Redirect to={`/workflows/${workflows[0].id}`}/>;
        }
        return <L.Body>
            <WorkflowList createMode={createMode} workflowId={workflowId} workflows={workflows}/>
            <WorkflowContent bucketList={bucketList} createMode={createMode} wfDetails={workflows.find(w => w.id === workflowId)}/>
        </L.Body>;
    };

    return <L.Container>
        <L.BreadcrumbContainer>
            <BreadcrumbWorkflow accounts={accounts} accountName={accountName} />
        </L.BreadcrumbContainer>
        { content() }
    </L.Container>;
}
