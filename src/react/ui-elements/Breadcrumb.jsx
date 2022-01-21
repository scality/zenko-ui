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
import { useQuery } from '../utils/hooks';
import { ellipsis } from 'polished';

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
    ${ellipsis('16rem')}
  }
`;

const breadcrumbPaths = (
  pathname: string,
  prefixPath: string,
): Array<Element<'label'>> => {
  const matchCreateBucketRoute = matchPath(pathname, {
    path: '/create-bucket',
  });
  if (matchCreateBucketRoute) {
    return [<label key="buckets">create bucket</label>];
  }

  const matchObjectRoutes = matchPath(pathname, {
    path: '/buckets/:bucketName/objects*',
  });
  if (matchObjectRoutes) {
    const bucketName = matchObjectRoutes.params.bucketName;
    if (!bucketName) {
      return [];
    }

    // When browsing inside a folder, display the folder name as the last breadcrumb path
    const isInFolder = prefixPath && prefixPath.slice(-1) === '/';
    let splits = [];
    if (
      matchPath(pathname, {
        path: '/buckets/:bucketName/objects/retention-setting',
      })
    ) {
      splits = prefixPath ? prefixPath.split('/') : [];
    } else if (prefixPath && isInFolder) {
      splits = prefixPath.split('/');
    } else if (prefixPath && !isInFolder) {
      splits = prefixPath.split('/').slice(0, -1);
    }

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
            <Link
              to={{
                pathname: `/buckets/${bucketName}/objects`,
                search: `?prefix=${prefix}/`,
              }}
            >
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

  const matchObjectsRoute = matchPath(pathname, {
    path: '/buckets/:bucketName/objects',
  });
  if (matchObjectsRoute) {
    return [
      <label key="buckets">
        <Link to={{ pathname: '/buckets' }}> All Buckets </Link>
      </label>,
      <label key="bucket-name">{matchObjectsRoute.params.bucketName}</label>,
    ];
  }

  const matchBucketRetensionSettingRoute = matchPath(pathname, {
    path: '/buckets/:bucketName/retention-setting',
  });
  if (matchBucketRetensionSettingRoute) {
    return [
      <label key="buckets">
        <Link to={{ pathname: '/buckets' }}>
          {matchBucketRetensionSettingRoute.params.bucketName}
        </Link>
      </label>,
      <label key="bucket-name">Object-lock settings</label>,
    ];
  }

  const matchBucketsRoute = matchPath(pathname, {
    path: '/buckets/:bucketName',
  });
  if (matchBucketsRoute) {
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
  const query = useQuery();
  const prefixPath = query.get('prefix');
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
        ...breadcrumbPaths(pathname, prefixPath),
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
