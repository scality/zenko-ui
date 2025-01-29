import {
  AppContainer,
  EmptyState,
  ErrorPage401,
  Icon,
  Loader,
  Sidebar,
} from '@scality/core-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, matchPath, useLocation } from 'react-router';
import { useTheme } from 'styled-components';
import makeMgtClient from '../js/managementClient';
import { AppState } from '../types/state';
import DataServiceRoleProvider, {
  useCurrentAccount,
} from './DataServiceRoleProvider';
import ManagementProvider from './ManagementProvider';
import {
  loadClients,
  loadInstanceLatestStatus,
  setManagementClient,
} from './actions';
import ReauthDialog from './ui-elements/ReauthDialog';

import { useConfig } from './next-architecture/ui/ConfigProvider';
import { useAuthGroups } from './utils/hooks';
import NoMatch from './NoMatch';
import Accounts from './account/Accounts';
import { Locations } from './locations/Locations';
import Endpoints from './endpoint/Endpoints';
import EndpointCreate from './endpoint/EndpointCreate';
import AccountCreate from './account/AccountCreate';
import AccountContent from './account/AccountContent';
import BucketCreate from './databrowser/buckets/BucketCreate';
import DataBrowser from './databrowser/DataBrowser';
import LocationEditor from './locations/LocationEditor';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import Workflows from './workflow/Workflows';
import CreateWorkflow from './workflow/CreateWorkflow';
import Objects from './databrowser/objects/Objects';
import Attachments from './account/iamAttachment/Attachments';
import AccountUpdateUser from './account/AccountUpdateUser';
import UpdateAccountPolicy from './account/UpdateAccountPolicy';
import AccountUserAccessKeys from './account/AccountUserAccessKeys';
import AccountCreateUser from './account/AccountCreateUser';
import CreateAccountPolicy from './account/CreateAccountPolicy';
import { ISVSteps } from './ISV/components/ISVSteps';

export const RemoveTrailingSlash = ({ ...rest }) => {
  const location = useLocation();

  // If the last character of the url is '/'
  if (location.pathname.match('/.*/$')) {
    return (
      <Navigate
        {...rest}
        to={{
          pathname: location.pathname.replace(/\/+$/, ''),
          search: location.search,
        }}
      />
    );
  } else return null;
};

const RedirectToAccount = () => {
  // To be replace later by react-query or context

  const { account: selectedAccount } = useCurrentAccount();
  const { pathname, search } = useLocation();
  const config = useConfig();

  const { isStorageManager } = useAuthGroups();

  if (selectedAccount) {
    return (
      <Navigate
        to={`${config.basePath}/accounts/${selectedAccount.Name}${pathname}${search}`}
      />
    );
  } else if (isStorageManager) {
    const description =
      pathname === '/workflows'
        ? { singular: 'Workflow', plural: 'Workflows' }
        : { singular: 'Bucket', plural: 'Buckets' };
    return (
      <EmptyState
        icon={pathname === '/workflows' ? 'Workflow' : 'Bucket'}
        link={`${config.basePath}/create-account`}
        listedResource={description}
        resourceToCreate="Account"
      ></EmptyState>
    );
  } else {
    return <ErrorPage401 />;
  }
};

function PrivateRoutes() {
  const dispatch = useDispatch();
  const isClientsLoaded = useSelector(
    (state: AppState) => state.auth.isClientsLoaded,
  );
  const user = useSelector((state: AppState) => state.oidc.user);
  const managementEndpoint = useSelector(
    (state: AppState) => state.auth?.config?.managementEndpoint,
  );
  const latestConfiguration = useSelector(
    (state: AppState) => state.configuration?.latest,
  );

  useMemo(() => {
    if (!!managementEndpoint && !!user?.access_token) {
      const managementClient = makeMgtClient(
        managementEndpoint,
        user.access_token,
      );
      dispatch(setManagementClient(managementClient));
    }
  }, [managementEndpoint, user?.access_token]);

  const isAuthenticated = !!user && !user.expired && user?.access_token;
  useEffect(() => {
    if (isAuthenticated) {
      // TODO: forbid loading clients when authorization server redirects the user back to ui.zenko.local with an authorization code.
      // That will fix management API request being canceled during autentication.
      if (!latestConfiguration) {
        dispatch(loadClients()); // FIXME To be delete soon
      }

      const refreshIntervalStatsUnit = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);

        if (user.expires_at >= currentTime) {
          dispatch(loadInstanceLatestStatus());
        }
      }, 30000);
      return () => {
        clearInterval(refreshIntervalStatsUnit);
      };
    }
  }, [dispatch, isAuthenticated, user, latestConfiguration]);

  const oidcLogout = useSelector((state: AppState) => state.auth.oidcLogout);
  useMemo(() => {
    if (!isAuthenticated && oidcLogout) {
      oidcLogout(true);
    }
  }, [isAuthenticated, oidcLogout]);

  if (!isClientsLoaded) {
    return (
      <Loader centered>
        <div>Loading clients</div>
      </Loader>
    );
  }

  return (
    <Routes>
      <Route path="create-location/*" element={<LocationEditor />} />
      <Route
        path="locations/:locationName/edit/*"
        element={<LocationEditor />}
      />
      <Route path="workflows/*" element={<RedirectToAccount />} />
      <Route path={`create-user/*`} element={<AccountCreateUser />} />
      <Route path={`create-policy/*`} element={<CreateAccountPolicy />} />
      <Route path="create-account/*" element={<AccountCreate />} />
      <Route path="create-dataservice/*" element={<EndpointCreate />} />
      <Route path="dataservices/*" element={<Endpoints />} />
      <Route path="locations/*" element={<Locations />} />

      <Route path="isv/configuration" element={<ISVSteps />} />

      <Route path="isv/configuration" element={<ISVSteps />} />
      <Route
        path={`accounts/:accountName/policies/:policyArn/attachments/*`}
        element={<Attachments />}
      />
      <Route
        path={`accounts/:accountName/users/:IAMUserName/update-user/*`}
        element={<AccountUpdateUser />}
      />
      <Route
        path={`accounts/:accountName/policies/:policyArn/:defaultVersionId/update-policy/*`}
        element={<UpdateAccountPolicy />}
      />
      <Route
        path={`accounts/:accountName/users/:IAMUserName/access-keys/*`}
        element={<AccountUserAccessKeys />}
      />
      <Route
        path="accounts/:accountName/users/:IAMUserName/attachments/*"
        element={<Attachments />}
      />
      <Route
        path={'accounts/:accountName/workflows/:workflowId/*'}
        element={<Workflows />}
      />
      <Route
        path={'accounts/:accountName/workflows/create-workflow/*'}
        element={<CreateWorkflow />}
      />
      <Route
        path="accounts/:accountName/data/workflows/*"
        element={<Workflows />}
      />
      <Route path="accounts/:accountName/workflows/*" element={<Workflows />} />
      <Route
        path="accounts/:accountName/create-bucket/*"
        element={<BucketCreate />}
      />
      <Route
        path={'accounts/:accountName/buckets/:bucketName/objects'}
        element={<Objects />}
      />
      <Route
        path="accounts/:accountName/data/buckets/*"
        element={<DataBrowser />}
      />
      <Route path="accounts/:accountName/buckets/*" element={<DataBrowser />} />
      <Route path="accounts/:accountName/*" element={<AccountContent />} />
      <Route path="accounts/*" element={<Accounts />} />
      <Route path="buckets/*" element={<RedirectToAccount />} />
      <Route path="/" element={<Navigate to="accounts" replace />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}

function InternalRoutes() {
  const [isSideBarOpen, setIsSideBarOpen] = useState(
    localStorage.getItem('isSideBarOpen') === null ||
      localStorage.getItem('isSideBarOpen') === 'true',
  );
  const location = useLocation();
  const theme = useTheme();
  const { isStorageManager } = useAuthGroups();
  const config = useConfig();
  const navigate = useBasenameRelativeNavigate();

  const doesRouteMatch = useCallback(
    (paths: string | string[]) => {
      if (Array.isArray(paths)) {
        return paths.some((path) =>
          matchPath(
            { path: config.basePath + path, end: true },
            location.pathname,
          ),
        );
      } else {
        return !!matchPath(
          { path: config.basePath + paths, end: true },
          location.pathname,
        );
      }
    },
    [location.pathname],
  );

  const routeWithoutSideBars = [
    '/create-account',
    '/create-dataservice',
    '/create-location',
    '/locations/:locations/edit',
    '/accounts/:accountName/create-user',
    '/accounts/:accountName/users/:user/update-user',
    '/accounts/:accountName/create-bucket',
    '/accounts/:accountName/workflows/create-workflow',
    '/accounts/:accountName/create-policy',

    '/isv/configuration',
  ];

  const hideSideBar = doesRouteMatch(routeWithoutSideBars);

  const sidebarConfig = {
    onToggleClick: () => {
      localStorage.setItem('isSideBarOpen', (!isSideBarOpen).toString());
      setIsSideBarOpen(!isSideBarOpen);
    },
    hoverable: true,
    expanded: isSideBarOpen,
    actions: [
      {
        label: 'Accounts',
        icon: <Icon name="Account" />,
        onClick: () => {
          navigate('/accounts');
        },
        active:
          doesRouteMatch('/accounts') ||
          doesRouteMatch('/accounts/:accountName') ||
          doesRouteMatch('/accounts/:accountName/properties') ||
          doesRouteMatch('/accounts/:accountName/locations') ||
          doesRouteMatch('/accounts/:accountName/users') ||
          doesRouteMatch('/accounts/:accountName/policies'),
      },
      {
        label: 'Data Browser',
        icon: <Icon name="Bucket" />,
        onClick: () => {
          navigate('/buckets');
        },
        active:
          doesRouteMatch('/buckets') ||
          doesRouteMatch('/accounts/:accountName/buckets/*') ||
          doesRouteMatch('/accounts/:accountName/data/buckets/*'),
      },
      {
        label: 'Workflows',
        icon: <Icon name="Workflow" />,
        onClick: () => {
          navigate('/workflows');
        },
        active:
          doesRouteMatch('/workflows') ||
          doesRouteMatch('/accounts/:accountName/workflows/*') ||
          doesRouteMatch('/accounts/:accountName/data/workflows/*'),
      },
      ...(isStorageManager
        ? [
            {
              label: 'Locations',
              icon: <Icon name="Location" />,
              onClick: () => {
                navigate('/locations');
              },
              active: doesRouteMatch('/locations'),
            },
            {
              label: 'Data Services',
              icon: <Icon name="Cubes" />,
              onClick: () => {
                navigate('/dataservices');
              },
              active: doesRouteMatch('/dataservices'),
            },
          ]
        : []),
    ],
  };

  return (
    <DataServiceRoleProvider>
      <>
        <ReauthDialog />
        <AppContainer
          hasPadding
          sidebarNavigation={
            hideSideBar ? <></> : <Sidebar {...sidebarConfig} />
          }
          //@ts-expect-error fix this when you are working on it
          style={{ color: theme.textPrimary }}
        >
          <RemoveTrailingSlash />
          <ManagementProvider>
            <PrivateRoutes />
          </ManagementProvider>
        </AppContainer>
      </>
    </DataServiceRoleProvider>
  );
}

export default InternalRoutes;
