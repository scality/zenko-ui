import * as L from '../ui-elements/ListLayout2';
import { Route, Switch, useLocation } from 'react-router-dom';
import { useParams, useRouteMatch } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Breadcrumb, breadcrumbPathsBuckets } from '../ui-elements/Breadcrumb';
import Buckets from './buckets/Buckets';
import { EmptyStateContainer } from '../ui-elements/Container';
import ListLayoutButtons from './HeaderButtons';
import Objects from './objects/Objects';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import { clearError } from '../actions';
import { push } from 'connected-react-router';
import ObjectLockSetting from './buckets/ObjectLockSetting';
import ObjectLockSettingOnObject from './objects/ObjectLockSetting';
import { useAccounts, useQueryParams } from '../utils/hooks';

export default function DataBrowser() {
  const dispatch = useDispatch();
  const { accountName } = useParams<{ accountName: string }>();
  const accounts = useAccounts();
  const hasError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const { pathname } = useLocation();
  const query = useQueryParams();
  const prefixPath = query.get('prefix');
  const { path } = useRouteMatch();

  // NOTE: create-bucket page has its own way to manage "byComponent" errors.
  if (hasError) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          iconClass="fas fa-5x fa-exclamation-triangle"
          title={errorMessage || 'An unexpected error has occurred.'}
          btnTitle="Display buckets"
          btnAction={() => {
            dispatch(clearError());
            dispatch(push('/buckets'));
          }}
        />
      </EmptyStateContainer>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          iconClass="fas fa-5x fa-wallet"
          title="Before browsing your data, create your first account."
          btnTitle="Create Account"
          btnAction={() => dispatch(push('/create-account'))}
        />
      </EmptyStateContainer>
    );
  }

  return (
    <L.Container>
      <L.BreadcrumbContainer>
        <Breadcrumb
          breadcrumbPaths={breadcrumbPathsBuckets(
            pathname,
            prefixPath,
            accountName,
          )}
        />
        <Switch>
          <Route exact path={`${path}/:bucketName/retention-setting`} />
          <Route path={`${path}/:bucketName`} component={ListLayoutButtons} />
        </Switch>
      </L.BreadcrumbContainer>
      <Switch>
        <Route
          exact
          path={`${path}/:bucketName/retention-setting`}
          component={ObjectLockSetting}
        />
        <Route
          exact
          path={`${path}/:bucketName/objects/retention-setting`}
          component={ObjectLockSettingOnObject}
        />
        <Route
          exact
          strict
          path={`${path}/:bucketName/objects`}
          component={Objects}
        />
        <Route path={`${path}/:bucketName/objects/*`} component={Objects} />
        <Route path={`${path}/:bucketName?`} component={Buckets} />
      </Switch>
    </L.Container>
  );
}
