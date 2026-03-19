import { AppContainer } from '@scality/core-ui';
import { useLocation, useParams } from 'react-router';
import type { Account } from '../../types/account';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import AccountDetails from './AccountDetails';
import { AccountHead } from './AccountHead';

function AccountContent() {
  const { pathname } = useLocation();
  const { account } = useCurrentAccount();
  const { accountName: accountNameParam } = useParams<{
    accountName: string;
  }>();

  return (
    <>
      <AppContainer.ContextContainer>
        <BreadcrumbAccount pathname={pathname} />
      </AppContainer.ContextContainer>
      <AppContainer.OverallSummary>
        <AccountHead accountName={accountNameParam} />
      </AppContainer.OverallSummary>
      <AppContainer.MainContent background="backgroundLevel1">
        <AccountDetails account={account as unknown as Account} />
      </AppContainer.MainContent>
    </>
  );
}

export default AccountContent;
