import { Link, matchPath } from 'react-router';
import {
  Breadcrumb as CoreUIBreadcrumb,
  ConstrainedText,
} from '@scality/core-ui';
import styled from 'styled-components';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';
import { fontSize } from '@scality/core-ui/dist/style/theme';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { JSX } from 'react';

// vendor from `polished` package
type Styles = {
  [ruleOrSelector: string]: string | number | Styles;
};
function ellipsis(width: string | number): Styles {
  if (width === void 0) {
    width = '100%';
  }

  return {
    display: 'inline-block',
    maxWidth: width,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
  };
}

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
  basePath: string,
): JSX.IntrinsicElements['label'][] => {
  const accountsURLPrefix = `/accounts/:accountName`;
  const matchCreateBucketRoute = matchPath(
    basePath + `${accountsURLPrefix}/create-bucket`,
    pathname,
  );
  if (matchCreateBucketRoute) {
    return [<label key="buckets">create bucket</label>];
  }

  const matchObjectRoutes = matchPath(
    basePath + `${accountsURLPrefix}/buckets/:bucketName/objects*`,
    pathname,
  );

  if (matchObjectRoutes) {
    const bucketName = matchObjectRoutes.params.bucketName;

    if (!bucketName) {
      return [];
    }

    // When browsing inside a folder, display the folder name as the last breadcrumb path
    const isInFolder = prefixPath && prefixPath.slice(-1) === '/';
    let splits: string[] = [];

    if (
      matchPath(
        basePath +
          `${accountsURLPrefix}/buckets/:bucketName/objects-retention-setting`,
        pathname,
      )
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
                pathname:
                  basePath +
                  `/accounts/${accountName}/buckets/${bucketName}/objects`,
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
            pathname: basePath + '/buckets',
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
            pathname:
              basePath + `/accounts/${accountName}/buckets/${bucketName}/objects`,
          }}
        >
          {' '}
          <ConstrainedText text={bucketName} />{' '}
        </Link>
      </label>,
      ...splitLabels,
    ];
  }

  const matchObjectsRoute = matchPath(
    basePath + `${accountsURLPrefix}/buckets/:bucketName/objects`,
    pathname,
  );

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
        <ConstrainedText text={matchObjectsRoute.params.bucketName} />
      </label>,
    ];
  }

  const matchBucketRetensionSettingRoute = matchPath(
    basePath + `${accountsURLPrefix}buckets/:bucketName/retention-setting`,
    pathname,
  );

  if (matchBucketRetensionSettingRoute) {
    return [
      <label key="buckets">
        <Link
          to={{
            pathname: basePath + '/buckets',
          }}
        >
          <ConstrainedText
            text={matchBucketRetensionSettingRoute.params.bucketName}
          />
        </Link>
      </label>,
      <label key="bucket-name">
        <ConstrainedText text={'Object-lock settings'} />
      </label>,
    ];
  }

  const matchBucketsRoute = matchPath(
    basePath + '/accounts/:accountName/buckets/:bucketName',
    pathname,
  );

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
  const config = useConfig();

  const matchAccountUserAccessKey = matchPath(
    config.basePath + '/accounts/:accountName/users/:userName/access-keys',
    pathname,
  );

  if (matchAccountUserAccessKey) {
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

  const matchAccountRoute = matchPath(
    config.basePath + '/accounts/:accountName' + '/*',
    pathname,
  );

  if (matchAccountRoute) {
    return (
      <CustomBreadCrumb
        paths={[<AccountRoleSelectButtonAndModal />]}
      ></CustomBreadCrumb>
    );
  }

  const matchAllAccountsRoute = matchPath(
    config.basePath + '/accounts/',
    pathname,
  );

  if (matchAllAccountsRoute) {
    return (
      <CustomBreadCrumb
        paths={[<label key="accounts">All Accounts</label>]}
      ></CustomBreadCrumb>
    );
  }

  return <></>;
}
