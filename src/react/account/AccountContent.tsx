import React, { useMemo } from 'react';
import {
  Route,
  Switch,
  useLocation,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as L from '../ui-elements/ListLayout5';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import type { AppState } from '../../types/state';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import AccountCreateUser from './AccountCreateUser';
import AccountUserAccessKeys from './AccountUserAccessKeys';

function AccountContent() {
  const { accountName: accountNameParam } = useParams();
  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  const accounts = useSelector(
    (state: AppState) => state.configuration.latest.users,
  );
  const account = useMemo(
    () => accounts.find((a) => a.userName === accountNameParam),
    [accounts, accountNameParam],
  );
  return (
    <L.Container>
      <Switch>
        <Route path={`${path}/create-user`}>
          <AccountCreateUser />
        </Route>
        <Route path={`${path}/users/:IAMUserName/access-keys`}>
          <AccountUserAccessKeys />
        </Route>
        <Route>
          <L.BreadcrumbContainer>
            <BreadcrumbAccount pathname={pathname} />
          </L.BreadcrumbContainer>
          <AccountHead />
          <L.Content>
            <AccountDetails account={account} />
          </L.Content>
        </Route>
      </Switch>
    </L.Container>
  );
}

export default AccountContent;