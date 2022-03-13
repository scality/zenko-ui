import { NavbarContainer, RouteContainer } from './ui-elements/Container';
import React, { useEffect } from 'react';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from 'react-router-dom';
import { loadClients, loadInstanceLatestStatus } from './actions';
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
import Workflows from './workflow/Workflows';
import IAMProvider from './IAMProvider';

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
  const selectedAccount = useSelector(
    (state: AppState) => state.auth.selectedAccount,
  );
  if (selectedAccount) {
    console.log('selectedAccount', selectedAccount);
    return <Redirect to={`/accounts/${selectedAccount.userName}/workflows`} />;
  } else {
    // TODO
    return null;
  }
};

const RedirectToWorkflow = () => {
  // To be replace later by react-query
  const workflows = useSelector((state: AppState) => state.workflow.list);
  if (workflows.length > 0) {
    return <Redirect to={`workflows/${workflows[0].id}`} />;
  } else {
    // TODO
    return null;
  }
};

function PrivateRoutes() {
  const dispatch = useDispatch();
  const isClientsLoaded = useSelector(
    (state: AppState) => state.auth.isClientsLoaded,
  );
  const user = useSelector((state: AppState) => state.oidc.user);
  useEffect(() => {
    const isAuthenticated = !!user && !user.expired;

    if (isAuthenticated) {
      // TODO: forbid loading clients when authorization server redirects the user back to ui.zenko.local with an authorization code.
      // That will fix management API request being canceled during autentication.
      dispatch(loadClients());
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
  }, [dispatch, user]);

  if (!isClientsLoaded) {
    return <Loader> Loading clients </Loader>;
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
      <Route exact path="/accounts/:accountName/workflows">
        <RedirectToWorkflow />
      </Route>
      <Route path="/accounts/:accountName?">
        <IAMProvider>
          <AccountContent />
        </IAMProvider>
      </Route>

      <Route path="/create-account" component={AccountCreate} />

      <Route
        path={[
          '/buckets/:bucketName?',
          '/buckets/:bucketName/objects',
          '/create-bucket',
        ]}
        component={DataBrowser}
      />

      <Route
        path={['/create-workflow', '/workflows/:workflowId?']}
        component={Workflows}
      />

      <Route exact path="/create-dataservice" component={EndpointCreate} />
      <Route exact path="/dataservices" component={Endpoints} />

      <Route path="*" component={NoMatch} />
    </Switch>
  );
}

function Routes() {
  return (
    <RouteContainer>
      <NavbarContainer>
        <Navbar />
      </NavbarContainer>
      <RemoveTrailingSlash />
      <PrivateRoutes />
    </RouteContainer>
  );
}

export default Routes;
