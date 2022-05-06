import { Link, matchPath } from 'react-router-dom';
import { Breadcrumb as CoreUIBreadcrumb } from '@scality/core-ui';
import { Element } from 'react';
import React from 'react';
import styled from 'styled-components';
import { ellipsis } from 'polished';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';

export const CustomBreadCrumb = styled(CoreUIBreadcrumb)`
  align-items: baseline;
  .sc-breadcrumb_item {
    display: flex;
    align-items: center;

    &:first-of-type {
      display: block;
      text-decoration: none;
      overflow: visible;
      * {
        color: ${(props) => props.theme.brand.textPrimary};
      }
      border-bottom: 0 !important;
    }
    ${ellipsis('16rem')}
  }
`;
const BaseBreadCrumb = styled(CoreUIBreadcrumb)`
  .sc-breadcrumb_item {
    display: flex;
    align-items: center;
    ${ellipsis('16rem')}
  }
`;

export const breadcrumbPathsBuckets = (
  pathname: string,
  prefixPath: string,
  accountName: string,
): Array<Element<'label'>> => {
  const accountsURLPrefix = `/accounts/${accountName}`;
  const matchCreateBucketRoute = matchPath(pathname, {
    path: `${accountsURLPrefix}/create-bucket`,
  });
  if (matchCreateBucketRoute) {
    return [<label key="buckets">create bucket</label>];
  }

  const matchObjectRoutes = matchPath(pathname, {
    path: `${accountsURLPrefix}/buckets/:bucketName/objects*`,
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
        path: `${accountsURLPrefix}/buckets/:bucketName/objects/retention-setting`,
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
      .filter((s) => !!s)
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
                pathname: `${accountsURLPrefix}/buckets/${bucketName}/objects`,
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
        <Link
          to={{
            pathname: '/buckets',
          }}
        >
          {' '}
          All Buckets{' '}
        </Link>{' '}
      </label>,
      <label key="objects">
        {' '}
        <Link
          to={{
            pathname: `${accountsURLPrefix}/buckets/${bucketName}/objects`,
          }}
        >
          {' '}
          {bucketName}{' '}
        </Link>
      </label>,
      ...splitLabels,
    ];
  }

  const matchObjectsRoute = matchPath(pathname, {
    path: `${accountsURLPrefix}/buckets/:bucketName/objects`,
  });

  if (matchObjectsRoute) {
    return [
      <label key="buckets">
        <Link
          to={{
            pathname: '/buckets',
          }}
        >
          {' '}
          All Buckets{' '}
        </Link>
      </label>,
      <label key="bucket-name">{matchObjectsRoute.params.bucketName}</label>,
    ];
  }

  const matchBucketRetensionSettingRoute = matchPath(pathname, {
    path: `${accountsURLPrefix}/buckets/:bucketName/retention-setting`,
  });

  if (matchBucketRetensionSettingRoute) {
    return [
      <label key="buckets">
        <Link
          to={{
            pathname: '/buckets',
          }}
        >
          {matchBucketRetensionSettingRoute.params.bucketName}
        </Link>
      </label>,
      <label key="bucket-name">Object-lock settings</label>,
    ];
  }

  const matchBucketsRoute = matchPath(pathname, {
    path: `${accountsURLPrefix}/buckets/:bucketName`,
  });

  if (matchBucketsRoute) {
    return [<label key="buckets">All Buckets</label>];
  }

  return [];
};

type Props = {
  breadcrumbPaths?: Array<Element<'label'>>;
};
//breadcrumb for data browser and workflows
export function Breadcrumb({ breadcrumbPaths }: Props) {
  const paths = [
    <AccountRoleSelectButtonAndModal></AccountRoleSelectButtonAndModal>,
  ];
  if (breadcrumbPaths) {
    paths.push(...breadcrumbPaths);
  }
  return <CustomBreadCrumb paths={paths} />;
}

export function BreadcrumbAccount({ pathname }: { pathname: string }) {
  const matchAccountUserAccessKey = matchPath(pathname, {
    path: '/accounts/:accountName/users/:userName/access-keys',
  });

  if (matchAccountUserAccessKey) {
    const accountName = matchAccountUserAccessKey.params.accountName || '';
    const userName = matchAccountUserAccessKey.params.userName;
    return (
      <BaseBreadCrumb
        paths={[
          <label key="accounts">
            <Link
              to={{
                pathname: '/accounts',
              }}
            >
              {' '}
              All Accounts{' '}
            </Link>
          </label>,
          <label key="account-name">
            <Link
              to={{
                pathname: `/accounts/${accountName}/users`,
              }}
            >
              {accountName}
            </Link>
          </label>,
          <label key="user-name">keys for {userName}</label>,
        ]}
      ></BaseBreadCrumb>
    );
  }

  const matchAccountRoute = matchPath(pathname, {
    path: '/accounts/:accountName',
  });

  if (matchAccountRoute) {
    return (
      <BaseBreadCrumb
        paths={[
          <label key="accounts">
            <Link
              to={{
                pathname: '/accounts',
              }}
            >
              {' '}
              All Accounts{' '}
            </Link>
          </label>,
          <label key="account-name">
            {matchAccountRoute.params.accountName}
          </label>,
        ]}
      ></BaseBreadCrumb>
    );
  }

  const matchAllAccountsRoute = matchPath(pathname, {
    path: '/accounts/',
  });

  if (matchAllAccountsRoute) {
    return (
      <BaseBreadCrumb
        paths={[<label key="accounts">All Accounts</label>]}
      ></BaseBreadCrumb>
    );
  }

  return [];
}
