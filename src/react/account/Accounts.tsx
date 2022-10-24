import { useLocation } from 'react-router-dom';
import AccountList from './AccountList';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import * as L from '../ui-elements/ListLayout5';
import Header from '../ui-elements/EntityHeader';
import { MultiAccountsIcon } from './MultiAccountsIcon';
import { useAccounts } from '../utils/hooks';
import { AppContainer, spacing } from '@scality/core-ui';

const Accounts = () => {
  const { pathname } = useLocation();
  const accounts = useAccounts();
  return (
    <L.Container>
      <AppContainer.ContextContainer>
        <BreadcrumbAccount pathname={pathname} />
      </AppContainer.ContextContainer>
      <AppContainer.OverallSummary>
        <Header
          icon={<MultiAccountsIcon />}
          headTitle={'All Accounts'}
          numInstance={accounts ? accounts.length : 0}
        ></Header>
      </AppContainer.OverallSummary>
      <AppContainer.MainContent
        background="backgroundLevel3"
        style={{ marginTop: spacing.f2 }}
      >
        <AccountList accounts={accounts} />
      </AppContainer.MainContent>
    </L.Container>
  );
};

export default Accounts;
