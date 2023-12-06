import { AppContainer, ErrorPage401, Icon, Sidebar } from '@scality/core-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Redirect,
  Route,
  RouteProps,
  Switch,
  matchPath,
  useHistory,
  useLocation,
} from 'react-router-dom';
import { useTheme } from 'styled-components';
import makeMgtClient from '../js/managementClient';
import type { AppState } from '../types/state';
import DataServiceRoleProvider, {
  useCurrentAccount,
} from './DataServiceRoleProvider';
import ManagementProvider from './ManagementProvider';
import NoMatch from './NoMatch';
import AccountContent from './account/AccountContent';
import AccountCreate from './account/AccountCreate';
import Accounts from './account/Accounts';
import {
  loadClients,
  loadInstanceLatestStatus,
  setManagementClient,
} from './actions';
import DataBrowser from './databrowser/DataBrowser';
import BucketCreate from './databrowser/buckets/BucketCreate';
import EndpointCreate from './endpoint/EndpointCreate';
import Endpoints from './endpoint/Endpoints';
import LocationEditor from './locations/LocationEditor';
import { Locations } from './locations/Locations';
import { EmptyStateContainer } from './ui-elements/Container';
import Loader from './ui-elements/Loader';
import ReauthDialog from './ui-elements/ReauthDialog';
import VeeamSteppers from './ui-elements/Veeam/VeeamSteps';
import { Warning } from './ui-elements/Warning';
import { useAuthGroups } from './utils/hooks';

export const RemoveTrailingSlash = ({ ...rest }) => {
  const location = useLocation();

  // If the last character of the url is '/'
  if (location.pathname.match('/.*/$')) {
    return (
      <Redirect
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
  const history = useHistory();
  const { account: selectedAccount } = useCurrentAccount();
  const { pathname, search } = useLocation();

  const { isStorageManager } = useAuthGroups();
  if (selectedAccount) {
    return (
      <Redirect to={`/accounts/${selectedAccount.Name}${pathname}${search}`} />
    );
  } else if (isStorageManager) {
    const description = pathname === '/workflows' ? 'workflows' : 'data';
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Account" size="5x" />}
          title={`Before browsing your ${description}, create your first account.`}
          btnTitle="Create Account"
          btnAction={() => history.push('/create-account')}
        />
      </EmptyStateContainer>
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
      <Loader>
        <div>Loading clients</div>
      </Loader>
    );
  }

  return (
    <Switch>
      <Route exact path="/" render={() => <Redirect to="/accounts" />} />
      <Route exact path="/create-location" component={LocationEditor} />
      <Route path="/locations/:locationName/edit" component={LocationEditor} />

      <Route path="/workflows" exact>
        <RedirectToAccount />
      </Route>
      <Route path="/buckets" exact>
        <RedirectToAccount />
      </Route>
      <Route path="/accounts/:accountName">
        <Switch>
          <Route path="/accounts/:accountName/buckets">
            <DataBrowser />
          </Route>
          <Route
            path={'/accounts/:accountName/create-bucket'}
            component={BucketCreate}
          />
          <Route path="/accounts/:accountName">
            <AccountContent />
          </Route>
        </Switch>
      </Route>

      <Route path="/accounts" component={Accounts} />
      <Route path="/create-account" component={AccountCreate} />

      <Route exact path="/create-dataservice" component={EndpointCreate} />
      <Route exact path="/dataservices" component={Endpoints} />
      <Route exact path="/locations" component={Locations} />
      <Route path="/veeam/configuration" component={VeeamSteppers} />
      <Route path="*" component={NoMatch} />
    </Switch>
  );
}

function Routes() {
  const [isSideBarOpen, setIsSideBarOpen] = useState(
    localStorage.getItem('isSideBarOpen') === null ||
      localStorage.getItem('isSideBarOpen') === 'true',
  );
  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const { isStorageManager } = useAuthGroups();

  const doesRouteMatch = useCallback(
    (paths: RouteProps | RouteProps[]) => {
      const location = history.location;
      if (Array.isArray(paths)) {
        const foundMatchingRoute = paths.find((path) => {
          const demo = matchPath(location.pathname, path);
          return demo;
        });
        return !!foundMatchingRoute;
      } else {
        return !!matchPath(location.pathname, paths);
      }
    },
    [location],
  );

  const routeWithoutSideBars = [
    { path: '/create-account' },
    { path: '/create-dataservice' },
    { path: '/create-location' },
    { path: '/locations/:locations/edit' },
    { path: '/accounts/:accountName/create-user' },
    { path: '/accounts/:accountName/users/:user/update-user' },
    { path: '/accounts/:accountName/create-bucket' },
    { path: '/accounts/:accountName/workflows/create-workflow' },
    { path: '/accounts/:accountName/create-policy' },
    { path: '/veeam/configuration' },
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
          history.push('/accounts');
        },
        active:
          doesRouteMatch({
            path: '/accounts',
            exact: true,
          }) ||
          doesRouteMatch({
            path: '/accounts/:accountName',
            exact: true,
          }) ||
          doesRouteMatch({
            path: '/accounts/:accountName/locations',
          }) ||
          doesRouteMatch({
            path: '/accounts/:accountName/users',
          }) ||
          doesRouteMatch({
            path: '/accounts/:accountName/policies',
          }),
      },
      {
        label: 'Data Browser',
        icon: <Icon name="Bucket" />,
        onClick: () => {
          history.push('/buckets');
        },
        active:
          doesRouteMatch({
            path: '/buckets',
          }) ||
          doesRouteMatch({
            path: '/accounts/:accountName/buckets',
          }),
      },
      {
        label: 'Workflows',
        icon: <i className="fas fa-route" />,
        onClick: () => {
          history.push('/workflows');
        },
        active:
          doesRouteMatch({
            path: '/workflows',
          }) ||
          doesRouteMatch({
            path: '/accounts/:accountName/workflows',
          }),
      },
      ...(isStorageManager
        ? [
            {
              label: 'Locations',
              icon: <Icon name="Location" />,
              onClick: () => {
                history.push('/locations');
              },
              active: doesRouteMatch({
                path: '/locations',
              }),
            },
            {
              label: 'Data Services',
              icon: <Icon name="Cubes" />,
              onClick: () => {
                history.push('/dataservices');
              },
              active: doesRouteMatch({
                path: '/dataservices',
              }),
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

export default Routes;
