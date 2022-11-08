import { EmptyStateContainer, NavbarContainer } from './ui-elements/Container';
import { PropsWithChildren, useEffect, useMemo } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import {
  assumeRoleWithWebIdentity,
  loadClients,
  loadInstanceLatestStatus,
  setManagementClient,
} from './actions';
import { useDispatch, useSelector } from 'react-redux';
import AccountCreate from './account/AccountCreate';
import Accounts from './account/Accounts';
import AccountContent from './account/AccountContent';
import type { AppState } from '../types/state';
import DataBrowser from './databrowser/DataBrowser';
import EndpointCreate from './endpoint/EndpointCreate';
import Endpoints from './endpoint/Endpoints';
import Loader from './ui-elements/Loader';
import LocationEditor from './backend/location/LocationEditor';
import { Navbar } from './Navbar';
import NoMatch from './NoMatch';
import IAMProvider from './IAMProvider';
import ManagementProvider from './ManagementProvider';
import DataServiceRoleProvider, {
  useCurrentAccount,
  useDataServiceRole,
} from './DataServiceRoleProvider';
import BucketCreate from './databrowser/buckets/BucketCreate';
import makeMgtClient from '../js/managementClient';
import { useQuery } from 'react-query';
import { getClients } from './utils/actions';
import { ErrorPage401, Icon } from '@scality/core-ui';
import { Warning } from './ui-elements/Warning';
import { push } from 'connected-react-router';
import { AppContainer, Layout2 } from '@scality/core-ui';

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
  const dispatch = useDispatch();
  const { account: selectedAccount } = useCurrentAccount();
  const { pathname } = useLocation();
  const loaded = useSelector((s: AppState) => s.networkActivity.counter === 0);
  const userGroups = useSelector(
    (state: AppState) => state.oidc.user?.profile?.groups || [],
  );
  const isStorageManager = userGroups.includes('StorageManager');
  if (selectedAccount) {
    return <Redirect to={`/accounts/${selectedAccount.Name}${pathname}`} />;
  } else if (loaded && isStorageManager) {
    const description = pathname === '/workflows' ? 'workflows' : 'data';
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Account" size="5x" />}
          title={`Before browsing your ${description}, create your first account.`}
          btnTitle="Create Account"
          btnAction={() => dispatch(push('/create-account'))}
        />
      </EmptyStateContainer>
    );
  } else if (loaded) {
    return <ErrorPage401 />;
  } else {
    return (
      <Loader>
        <div>Loading</div>
      </Loader>
    );
  }
};

function WithAssumeRole({
  children,
}: PropsWithChildren<Record<string, unknown>>) {
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.oidc.user);
  const { zenkoClient } = getClients(useSelector((state: AppState) => state));
  const isZenkoClientLogin = zenkoClient.getIsLogin();
  const { roleArn } = useDataServiceRole();

  useEffect(() => {
    const isAuthenticated = !!user && !user.expired;

    if (isAuthenticated && roleArn) {
      dispatch(assumeRoleWithWebIdentity(roleArn));
    }
  }, [dispatch, user, roleArn]);

  if (isZenkoClientLogin) {
    return <>{children}</>;
  } else {
    return (
      <Loader>
        <div>Loading</div>
      </Loader>
    );
  }
}

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

  useQuery({
    queryKey: ['managementClient', user?.access_token || ''],
    queryFn: () => {
      return makeMgtClient(managementEndpoint, user.access_token);
    },
    onSuccess: (managementClient) => {
      dispatch(setManagementClient(managementClient));
    },
    enabled: !!managementEndpoint && !!user?.access_token,
  });

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
      <Route path="/accounts" exact component={Accounts} />
      <Route path="/workflows" exact>
        <RedirectToAccount />
      </Route>
      <Route path="/buckets" exact>
        <RedirectToAccount />
      </Route>
      <Route path="/accounts/:accountName">
        <DataServiceRoleProvider>
          <IAMProvider>
            <WithAssumeRole>
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
            </WithAssumeRole>
          </IAMProvider>
        </DataServiceRoleProvider>
      </Route>

      <Route path="/create-account" component={AccountCreate} />

      <Route exact path="/create-dataservice" component={EndpointCreate} />
      <Route exact path="/dataservices" component={Endpoints} />

      <Route path="*" component={NoMatch} />
    </Switch>
  );
}

function Routes() {
  return (
    <Layout2
      headerNavigation={
        <NavbarContainer>
          <Navbar />
        </NavbarContainer>
      }
    >
      <AppContainer hasPadding>
        <RemoveTrailingSlash />
        <ManagementProvider>
          <PrivateRoutes />
        </ManagementProvider>
      </AppContainer>
    </Layout2>
  );
}

export default Routes;
