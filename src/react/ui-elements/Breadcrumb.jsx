// @flow
import { Link, matchPath } from 'react-router-dom';
import type { Account } from '../../types/account';
import { Breadcrumb as CoreUIBreadcrumb } from '@scality/core-ui';
import type { Element } from 'react';
import React from 'react';
import { assumeRoleWithWebIdentity } from '../actions';
import { push } from 'connected-react-router';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const Select = styled.select`
    outline: 0px;
    font-size: inherit;
`;

const breadcrumbPaths = (pathname: string): Array<Element<'label'>> => {
    let match = matchPath(pathname, { path: '/create-bucket' });
    if (match) {
        return [<label key='buckets'>create bucket</label>];
    }
    match = matchPath(pathname, { path: '/buckets/:bucketName/objects/*' });
    if (match) {
        const bucketName = match.params.bucketName;
        if (!bucketName) {
            return [];
        }
        const splits = match.params['0'] ? match.params['0'].split('/'): [];
        let prefix = '';
        const splitLabels = splits.filter(s => !!s).map((s, i, arr) => {
            // NOTE: last label does not need a link
            if (i === arr.length - 1) {
                return <label key={s}>{s}</label>;
            }
            prefix = prefix ? `${prefix}/${s}`: s;
            return <label key={s}><Link to={{ pathname: `/buckets/${bucketName}/objects/${prefix}` }}> {s} </Link></label>;
        });
        return [
            <label key='buckets'> <Link to={{ pathname: '/buckets' }}> buckets </Link> </label>,
            <label key='objects'> <Link to={{ pathname: `/buckets/${bucketName}/objects` }}> {bucketName} </Link></label>,
            ...splitLabels,
        ];
    }
    match = matchPath(pathname, { path: '/buckets/:bucketName/objects' });
    if (match) {
        return [
            <label key='buckets'><Link to={{ pathname: '/buckets' }}> buckets </Link></label>,
            <label key='bucket-name'>{match.params.bucketName}</label>,
        ];
    }
    match = matchPath(pathname, { path: '/buckets/:bucketName' });
    if (match) {
        return [
            <label key='buckets'>buckets</label>,
        ];
    }
    return [];
};

type Props = {
    accounts: Array<Account>,
    accountName: string,
    pathname: string,
};

export function Breadcrumb({ accounts, accountName, pathname }: Props){
    const dispatch = useDispatch();

    const switchAccount = (selectedName) => {
        const account = selectedName &&
            selectedName !== accountName &&
            accounts.find(a => a.userName === selectedName);
        if (!account) {
            return;
        }
        dispatch(assumeRoleWithWebIdentity(`arn:aws:iam::${account.id}:role/roleForB`))
            .then(() => dispatch(push('/buckets')));
    };

    return <CoreUIBreadcrumb
        paths={[
            <Select key={0} onChange={e => switchAccount(e.target.value)} value={accountName}>
                { accounts.map(account => <option key={account.userName} value={account.userName}>{account.userName}</option>)}
            </Select>,
            ...breadcrumbPaths(pathname),
        ]}
    />;
}
