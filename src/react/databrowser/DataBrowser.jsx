// @flow
import * as L from '../ui-elements/ListLayout2';
import { Route, Switch, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Breadcrumb } from '../ui-elements/Breadcrumb';
import BucketCreate from './buckets/BucketCreate';
import Buckets from './buckets/Buckets';
import { EmptyStateContainer } from '../ui-elements/Container';
import Objects from './objects/Objects';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import { clearError } from '../actions';
import { push } from 'connected-react-router';


export default function DataBrowser(){
    const dispatch = useDispatch();
    const accountName = useSelector((state: AppState) => state.auth.selectedAccount.userName);
    const accounts = useSelector((state: AppState) => state.configuration.latest.users);
    const hasError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);
    const { pathname } = useLocation();

    // NOTE: create-bucket page has its own way to manage "byComponent" errors.
    if (hasError && pathname !== '/create-bucket') {
        return <EmptyStateContainer>
            <Warning
                centered={true}
                iconClass="fas fa-5x fa-exclamation-triangle"
                title={errorMessage || 'An unexpected error has occurred.'}
                btnTitle='Display buckets'
                btnAction={() => { dispatch(clearError()); dispatch(push('/buckets')); }} />
        </EmptyStateContainer>;
    }

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
    return <L.Container>
        <L.BreadcrumbContainer>
            <Breadcrumb accounts={accounts} accountName={accountName} pathname={pathname} />
        </L.BreadcrumbContainer>
        <Switch>
            <Route exact strict path='/buckets/:bucketName/objects' component={Objects} />
            <Route path='/buckets/:bucketName/objects/*' component={Objects} />
            <Route path="/buckets/:bucketName?" component={Buckets} />
            <Route path="/create-bucket" component={BucketCreate} />
        </Switch>
    </L.Container>;
}
