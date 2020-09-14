// @flow
import * as L from '../ui-elements/ListLayout2';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Breadcrumb } from '@scality/core-ui';
import BucketCreate from './buckets/BucketCreate';
import Buckets from './buckets/Buckets';
import { EmptyStateContainer } from '../ui-elements/Container';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import { assumeRoleWithWebIdentity } from '../actions';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const Select = styled.select`
    outline: 0px;
    font-size: inherit;
`;

const breadcrumbName = url => {
    return url.split('/')[1];
};

export default function DataBrowser(){
    const dispatch = useDispatch();
    const accountName = useSelector((state: AppState) => state.s3.listBucketsResults.ownerName);
    const accounts = useSelector((state: AppState) => state.configuration.latest.users);
    const { url } = useRouteMatch();

    const switchAccount = name => {
        const account = name && name !== accountName && accounts.find(a => a.userName === name);
        if (!account) {
            return;
        }
        dispatch(assumeRoleWithWebIdentity(`arn:aws:iam::${account.id}:role/roleForB`))
            .then(() => dispatch(push('/buckets')));
    };

    if (accounts.length === 0) {
        return <EmptyStateContainer>
            <Warning
                iconClass="fas fa-5x fa-wallet"
                title='Before browsing your data, create your first account.'
                btnTitle='Create Account'
                btnAction={() => dispatch(push('/create-account'))} />
        </EmptyStateContainer>;
    }
    return <L.Container>
        <L.BreadcrumbContainer>
            <Breadcrumb
                paths={[
                    <Select key={1} onChange={e => switchAccount(e.target.value) }>
                        { accounts.map(account => <option key={account.userName} selected={account.userName === accountName} value={account.userName}>{account.userName}</option>)}
                    </Select>,
                    <label key={2}>{breadcrumbName(url)}</label>,
                ]}
            />
        </L.BreadcrumbContainer>
        <Switch>
            <Route path="/buckets/:bucketName?" component={Buckets} />
            <Route path="/create-bucket" component={BucketCreate} />
        </Switch>
    </L.Container>;
}
