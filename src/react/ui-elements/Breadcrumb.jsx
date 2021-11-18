// @flow
import { Link, matchPath } from 'react-router-dom';
import type { Account } from '../../types/account';
import { Breadcrumb as CoreUIBreadcrumb } from '@scality/core-ui';
import type { Element } from 'react';
import React from 'react';
import { Select } from '@scality/core-ui/dist/next';
import { push } from 'connected-react-router';
import { selectAccountID } from '../actions';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

const CustomBreadCrumb = styled(CoreUIBreadcrumb)`
  .sc-breadcrumb_item {
    display: flex;
    align-items: center;

    &:first-of-type {
      display: block;
      width: 150px;
      text-decoration: none;
      overflow: visible;
      * {
        color: ${props => props.theme.brand.textPrimary};
      }
      border-bottom: 0 !important;
    }
  }
`;

const breadcrumbPaths = (pathname: string): Array<Element<'label'>> => {
  let match = matchPath(pathname, { path: '/create-bucket' });
  if (match) {
    return [<label key="buckets">create bucket</label>];
  }
  match = matchPath(pathname, { path: '/buckets/:bucketName/objects/*' });
  if (match) {
    const bucketName = match.params.bucketName;
    if (!bucketName) {
      return [];
    }
    const splits = match.params['0'] ? match.params['0'].split('/') : [];
    let prefix = '';
    const splitLabels = splits
      .filter(s => !!s)
      .map((s, i, arr) => {
        // NOTE: last label does not need a link
        if (i === arr.length - 1) {
          return <label key={s}>{s}</label>;
        }
        prefix = prefix ? `${prefix}/${s}` : s;
        return (
          <label key={s}>
            <Link to={{ pathname: `/buckets/${bucketName}/objects/${prefix}` }}>
              {' '}
              {s}{' '}
            </Link>
          </label>
        );
      });
    return [
      <label key="buckets">
        {' '}
        <Link to={{ pathname: '/buckets' }}> All Buckets </Link>{' '}
      </label>,
      <label key="objects">
        {' '}
        <Link to={{ pathname: `/buckets/${bucketName}/objects` }}>
          {' '}
          {bucketName}{' '}
        </Link>
      </label>,
      ...splitLabels,
    ];
  }
  match = matchPath(pathname, { path: '/buckets/:bucketName/objects' });
  if (match) {
    return [
      <label key="buckets">
        <Link to={{ pathname: '/buckets' }}> All Buckets </Link>
      </label>,
      <label key="bucket-name">{match.params.bucketName}</label>,
    ];
  }
  match = matchPath(pathname, {
    path: '/buckets/:bucketName/retention-setting',
  });
  if (match) {
    return [
      <label key="buckets">
        <Link to={{ pathname: '/buckets' }}>{match.params.bucketName}</Link>
      </label>,
      <label key="bucket-name">Object-lock settings</label>,
    ];
  }
  match = matchPath(pathname, { path: '/buckets/:bucketName' });
  if (match) {
    return [<label key="buckets">All Buckets</label>];
  }
  return [];
};

type Props = {
  accounts: Array<Account>,
  accountName: ?string,
  pathname: string,
};

export function Breadcrumb({ accounts, accountName, pathname }: Props) {
  const dispatch = useDispatch();

  const switchAccount = selectedName => {
    const account =
      selectedName &&
      selectedName !== accountName &&
      accounts.find(a => a.userName === selectedName);
    if (!account) {
      return;
    }
    dispatch(selectAccountID(account.id)).then(() =>
      dispatch(push('/buckets')),
    );
  };

  return (
    <CustomBreadCrumb
      paths={[
        <Select
          key={0}
          onChange={switchAccount}
          value={accountName}
          variant="rounded"
        >
          {accounts.map(account => (
            <Select.Option key={account.userName} value={account.userName}>
              {account.userName}
            </Select.Option>
          ))}
        </Select>,
        ...breadcrumbPaths(pathname),
      ]}
    />
  );
}

type BreadcrumbWorkflowProps = {
  accounts: Array<Account>,
  accountName: ?string,
};
export function BreadcrumbWorkflow({
  accounts,
  accountName,
}: BreadcrumbWorkflowProps) {
  const dispatch = useDispatch();

  const switchAccount = selectedName => {
    const account =
      selectedName &&
      selectedName !== accountName &&
      accounts.find(a => a.userName === selectedName);
    if (!account) {
      return;
    }
    dispatch(selectAccountID(account.id)).then(() =>
      dispatch(push('/workflows')),
    );
  };

  return (
    <CustomBreadCrumb
      paths={[
        <Select
          key={0}
          onChange={switchAccount}
          value={accountName}
          variant="rounded"
        >
          {accounts.map(account => (
            <Select.Option key={account.userName} value={account.userName}>
              {account.userName}
            </Select.Option>
          ))}
        </Select>,
      ]}
    />
  );
}
