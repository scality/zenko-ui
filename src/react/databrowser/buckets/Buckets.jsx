// @flow
import * as L from '../../ui-elements/ListLayout2';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Breadcrumb } from '@scality/core-ui';
import BucketHead from './BucketHead';
import BucketList from './BucketList';
import React from 'react';
import { assumeRoleWithWebIdentity } from '../../actions';
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

    const switchAccount = accountName => {
        const account = accountName && accounts.find(a => a.userName === accountName);
        if (!account) {
            return;
        }
        dispatch(assumeRoleWithWebIdentity(`arn:aws:iam::${account.id}:role/roleForB`));
    };

    return <L.Container>
        <L.BreadcrumbContainer>
            <Breadcrumb
                paths={[
                    <Select key={1} onChange={e => switchAccount(e.target.value) } name="cars" id="cars">
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
