import React, { useMemo } from 'react';
import {
  Route,
  Switch,
  useLocation,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import * as L from '../ui-elements/ListLayout5';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import AccountCreateUser from './AccountCreateUser';
import AccountUpdateUser from './AccountUpdateUser';
import AccountUserAccessKeys from './AccountUserAccessKeys';
import CreateWorkflow from '../workflow/CreateWorkflow';
import Workflows from '../workflow/Workflows';
import { useAccounts } from '../utils/hooks';

function AccountContent() {
  const { accountName: accountNameParam } = useParams<{
    accountName: string;
  }>();

  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  const accounts = useAccounts();
  const account = useMemo(
    () => accounts.find((a) => a.Name === accountNameParam),
    [accounts, accountNameParam],
  );

  return (
    <L.Container>
      <Switch>
        <Route path={`${path}/create-user`}>
          <AccountCreateUser />
        </Route>
        <Route path={`${path}/users/:IAMUserName/update-user`}>
          <AccountUpdateUser />
        </Route>
        <Route path={`${path}/users/:IAMUserName/access-keys`}>
          <AccountUserAccessKeys />
        </Route>
        <Route path={`${path}/workflows/create-workflow`}>
          <CreateWorkflow />
        </Route>
        <Route path={`${path}/workflows/:workflowId?`}>
          <Workflows />
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
