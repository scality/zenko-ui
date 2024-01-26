import { Link, matchPath } from 'react-router-dom';
import {
  Breadcrumb as CoreUIBreadcrumb,
  ConstrainedText,
} from '@scality/core-ui';
import styled from 'styled-components';
import { ellipsis } from 'polished';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';
import { fontSize } from '@scality/core-ui/dist/style/theme';

export const CustomBreadCrumb = styled(CoreUIBreadcrumb)`
  align-items: center;
  .sc-breadcrumb_item {
    display: flex;
    font-size: ${fontSize.base};
    align-items: center;

    &:first-of-type {
      display: block;
      text-decoration: none;
      overflow: visible;
      * {
        color: ${(props) => props.theme.textPrimary};
      }
      border-bottom: 0 !important;
      min-width: auto;
    }
    ${ellipsis('16rem')}
  }
`;

export const breadcrumbPathsBuckets = (
  pathname: string,
  prefixPath: string,
  accountName: string,
): JSX.IntrinsicElements['label'][] => {
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
    //@ts-expect-error fix this when you are working on it
    const bucketName = matchObjectRoutes.params.bucketName;

    if (!bucketName) {
      return [];
    }

    // When browsing inside a folder, display the folder name as the last breadcrumb path
    const isInFolder = prefixPath && prefixPath.slice(-1) === '/';
    let splits: string[] = [];

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
          return (
            <label key={s}>
              <ConstrainedText text={s} />
            </label>
          );
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
              <ConstrainedText text={s} />{' '}
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
          <ConstrainedText text={'All Buckets'} />{' '}
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
          <ConstrainedText text={bucketName} />{' '}
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
          <ConstrainedText text={'All Buckets'} />{' '}
        </Link>
      </label>,
      <label key="bucket-name">
        <ConstrainedText
          text={
            //@ts-expect-error fix this when you are working on it
            matchObjectsRoute.params.bucketName
          }
        />
      </label>,
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
          <ConstrainedText
            text={
              //@ts-expect-error fix this when you are working on it
              matchBucketRetensionSettingRoute.params.bucketName
            }
          />
        </Link>
      </label>,
      <label key="bucket-name">
        <ConstrainedText text={'Object-lock settings'} />
      </label>,
    ];
  }

  const matchBucketsRoute = matchPath(pathname, {
    path: `${accountsURLPrefix}/buckets/:bucketName`,
  });

  if (matchBucketsRoute) {
    return [
      <label key="buckets">
        <ConstrainedText text={'All Buckets'} />
      </label>,
    ];
  }

  return [];
};

type Props = {
  breadcrumbPaths?: JSX.IntrinsicElements['label'][];
};
//breadcrumb for data browser and workflows
export function Breadcrumb({ breadcrumbPaths }: Props) {
  const paths = [<AccountRoleSelectButtonAndModal />];
  if (breadcrumbPaths) {
    paths.push(
      //@ts-expect-error fix this when you are working on it
      ...breadcrumbPaths,
    );
  }
  return <CustomBreadCrumb paths={paths} />;
}

export function BreadcrumbAccount({ pathname }: { pathname: string }) {
  const matchAccountUserAccessKey = matchPath(pathname, {
    path: '/accounts/:accountName/users/:userName/access-keys',
  });

  if (matchAccountUserAccessKey) {
    //@ts-expect-error fix this when you are working on it
    const userName = matchAccountUserAccessKey.params.userName;
    return (
      <CustomBreadCrumb
        paths={[
          <AccountRoleSelectButtonAndModal />,
          <label key="user-name">keys for {userName}</label>,
        ]}
      ></CustomBreadCrumb>
    );
  }

  const matchAccountRoute = matchPath(pathname, {
    path: '/accounts/:accountName',
  });

  if (matchAccountRoute) {
    return (
      <CustomBreadCrumb
        paths={[<AccountRoleSelectButtonAndModal />]}
      ></CustomBreadCrumb>
    );
  }

  const matchAllAccountsRoute = matchPath(pathname, {
    path: '/accounts/',
  });

  if (matchAllAccountsRoute) {
    return (
      <CustomBreadCrumb
        paths={[<label key="accounts">All Accounts</label>]}
      ></CustomBreadCrumb>
    );
  }

  return <></>;
}
