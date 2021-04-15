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
    const { ruleId } = useParams();
    const { pathname } = useLocation();
    const rules = useSelector((state: AppState) => state.configuration.rules);
    const createMode = pathname === '/create-workflow';
    const accountName = useSelector((state: AppState) => state.auth.selectedAccount.userName);
    const accounts = useSelector((state: AppState) => state.configuration.latest.users);

    if (accounts.length === 0) {
        return <EmptyStateContainer>
            <Warning
                centered={true}
                iconClass="fas fa-5x fa-wallet"
                title='Before browsing your data, create your first account.'
                btnTitle='Create Account'
                btnAction={() => dispatch(push('/create-account'))} />
        </EmptyStateContainer>;
    }

    const content = () => {
        if (!createMode && rules.length === 0) {
            return <EmptyStateContainer>
                <Warning
                    iconClass="fas fa-5x fa-wallet"
                    title='Before browsing your rules, create your first rule.'
                    btnTitle='Create Rule'
                    btnAction={() => dispatch(push('/create-workflow'))} />
            </EmptyStateContainer>;
        }

        // redirect to the first workflow.
        if (!createMode && rules.length > 0 && !ruleId) {
            return <Redirect to={`/workflows/${rules[0].id}`}/>;
        }
        return <L.Body>
            <WorkflowList createMode={createMode} ruleId={ruleId} rules={rules}/>
            <WorkflowContent createMode={createMode} ruleDetails={rules.find(r => r.id === ruleId)}/>
        </L.Body>;
    };

    return <L.Container>
        <L.BreadcrumbContainer>
            <BreadcrumbWorkflow accounts={accounts} accountName={accountName} />
        </L.BreadcrumbContainer>
        { content() }
    </L.Container>;
}
