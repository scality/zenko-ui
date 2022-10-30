import { Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import * as L from '../ui-elements/ListLayout5';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import AccountCreateUser from './AccountCreateUser';
import AccountUpdateUser from './AccountUpdateUser';
import AccountUserAccessKeys from './AccountUserAccessKeys';
import CreateWorkflow from '../workflow/CreateWorkflow';
import Workflows from '../workflow/Workflows';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import UpdateAccountPolicy from './UpdateAccountPolicy';
import CreateAccountPolicy from './CreateAccountPolicy';
import Attachments from './iamAttachment/Attachments';
import { AppContainer } from '@scality/core-ui';

function AccountContent() {
  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  const { account } = useCurrentAccount();

  return (
    <L.Container
      style={{
        overflow: pathname.includes('workflows') ? 'hidden' : undefined,
      }}
    >
      <Switch>
        <Route path={`${path}/create-user`}>
          <AccountCreateUser />
        </Route>
        <Route path={`${path}/create-policy`}>
          <CreateAccountPolicy />
        </Route>
        <Route path={`${path}/users/:IAMUserName/update-user`}>
          <AccountUpdateUser />
        </Route>
        <Route
          path={`${path}/policies/:policyArn/:defaultVersionId/update-policy`}
        >
          <UpdateAccountPolicy />
        </Route>
        <Route path={`${path}/users/:IAMUserName/access-keys`}>
          <AccountUserAccessKeys />
        </Route>
        <Route path={`${path}/users/:IAMUserName/attachments`}>
          <Attachments />
        </Route>
        <Route path={`${path}/policies/:policyArn/attachments`}>
          <Attachments />
        </Route>
        <Route path={`${path}/workflows/create-workflow`}>
          <CreateWorkflow />
        </Route>
        <Route path={`${path}/workflows/:workflowId?`}>
          <Workflows />
        </Route>
        <Route>
          {/* <L.BreadcrumbContainer> */}
          <AppContainer.ContextContainer>
            <BreadcrumbAccount pathname={pathname} />
          </AppContainer.ContextContainer>
          {/* </L.BreadcrumbContainer> */}
          <AppContainer.OverallSummary>
            <AccountHead />
          </AppContainer.OverallSummary>
          <AppContainer.MainContent background="backgroundLevel1">
            <L.Content>
              <AccountDetails account={account} />
            </L.Content>
          </AppContainer.MainContent>
        </Route>
      </Switch>
    </L.Container>
  );
}

export default AccountContent;
