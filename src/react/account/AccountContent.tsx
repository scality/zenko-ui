import {
  Route,
  Switch,
  useLocation,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import AccountDetails from './AccountDetails';
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
import { AppContainer, Icon, Stack, Text } from '@scality/core-ui';

function AccountContent() {
  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  const { account } = useCurrentAccount();
  const { accountName: accountNameParam } = useParams<{
    accountName: string;
  }>();

  return (
    <>
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
          <AppContainer.ContextContainer>
            <BreadcrumbAccount pathname={pathname} />
          </AppContainer.ContextContainer>
          <AppContainer.OverallSummary>
            <Stack gap="r16">
              <Icon name="Account" color="infoPrimary" size="2x" withWrapper />
              <Text variant="Larger">{accountNameParam}</Text>
            </Stack>
          </AppContainer.OverallSummary>
          <AppContainer.MainContent background="backgroundLevel1">
            <AccountDetails account={account} />
          </AppContainer.MainContent>
        </Route>
      </Switch>
    </>
  );
}

export default AccountContent;
