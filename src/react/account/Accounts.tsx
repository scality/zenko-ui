import { useLocation } from 'react-router-dom';
import AccountList from './AccountList';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import * as L from '../ui-elements/ListLayout5';
import Header from '../ui-elements/EntityHeader';
import { MultiAccountsIcon } from './MultiAccountsIcon';
import { useAccounts } from '../utils/hooks';

const Accounts = () => {
  const { pathname } = useLocation();
  const accounts = useAccounts();
  return (
    <L.Container>
      <L.BreadcrumbContainer>
        <BreadcrumbAccount pathname={pathname} />
      </L.BreadcrumbContainer>
      <Header
        icon={<MultiAccountsIcon />}
        headTitle={'All Accounts'}
        numInstance={accounts ? accounts.length : 0}
      ></Header>
      <L.Content>
        <AccountList accounts={accounts} />
      </L.Content>
    </L.Container>
  );
};

export default Accounts;
