import { useLocation } from 'react-router-dom';
import AccountList from './AccountList';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import Header from '../ui-elements/EntityHeader';
import { MultiAccountsIcon } from './MultiAccountsIcon';
import { useAccounts } from '../utils/hooks';
import { AppContainer } from '@scality/core-ui';

const Accounts = () => {
  const { pathname } = useLocation();
  const { accounts } = useAccounts();
  return (
    <>
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
      <AppContainer.MainContent background="backgroundLevel3">
        <AccountList accounts={accounts} />
      </AppContainer.MainContent>
    </>
  );
};

export default Accounts;
