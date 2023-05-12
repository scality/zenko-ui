import { useLocation } from 'react-router-dom';
import AccountList from './AccountList';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import Header from '../ui-elements/EntityHeader';
import { MultiAccountsIcon } from './MultiAccountsIcon';
import { AppContainer, ErrorPage500 } from '@scality/core-ui';
import { useListAccounts } from '../next-architecture/domain/business/accounts';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { useAccessibleAccountsAdapter } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';

const Accounts = () => {
  const { pathname } = useLocation();
  const metricsAdapter = useMetricsAdapter();
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const { accounts } = useListAccounts({
    metricsAdapter,
    accessibleAccountsAdapter,
  });

  return (
    <>
      <AppContainer.ContextContainer>
        <BreadcrumbAccount pathname={pathname} />
      </AppContainer.ContextContainer>
      {accounts.status === 'loading' && <div>Loading accounts...</div>}
      {accounts.status === 'error' && <ErrorPage500 locale="en" />}
      {accounts.status === 'success' && (
        <>
          <AppContainer.OverallSummary>
            <Header
              icon={<MultiAccountsIcon />}
              headTitle={'All Accounts'}
              numInstance={accounts.value.length}
            ></Header>
          </AppContainer.OverallSummary>
          <AppContainer.MainContent background="backgroundLevel3">
            <AccountList accounts={accounts.value} />
          </AppContainer.MainContent>
        </>
      )}
    </>
  );
};

export default Accounts;
