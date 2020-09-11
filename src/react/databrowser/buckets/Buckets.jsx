// @flow
import * as L from '../../ui-elements/ListLayout2';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Breadcrumb } from '@scality/core-ui';
import BucketHead from './BucketHead';
import BucketList from './BucketList';
import { EmptyStateContainer } from '../../ui-elements/Container';
import React from 'react';
import { Warning } from '../../ui-elements/Warning';
import { assumeRoleWithWebIdentity } from '../../actions';
import { push } from 'connected-react-router';
import styled from 'styled-components';

const Select = styled.select`
    outline: 0px;
    font-size: inherit;
`;

export default function Buckets(){
    const dispatch = useDispatch();

    const buckets = useSelector((state: AppState) => state.s3.listBucketsResults.list);
    const accountName = useSelector((state: AppState) => state.s3.listBucketsResults.ownerName);
    const locations = useSelector((state: AppState) => state.configuration.latest.locations);
    const accounts = useSelector((state: AppState) => state.configuration.latest.users);

    const switchAccount = name => {
        if (name === accountName) {
            return;
        }
        const account = accountName && accounts.find(a => a.userName === name);
        if (!account) {
            return;
        }
        dispatch(assumeRoleWithWebIdentity(`arn:aws:iam::${account.id}:role/roleForB`));
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
                    <label key={2}>buckets</label>,
                ]}
            />
        </L.BreadcrumbContainer>
        <BucketHead buckets={buckets} />

        <L.Body>
            <BucketList buckets={buckets} locations={locations} />
            <L.ContentSection>
            </L.ContentSection>
        </L.Body>

    </L.Container>;
}
