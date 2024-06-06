import {
  AppContainer,
  EmptyState,
  ErrorPage401,
  ErrorPage500,
  Icon,
  Loader,
} from '@scality/core-ui';
import { useHistory, useLocation } from 'react-router-dom';

import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useListAccounts } from '../next-architecture/domain/business/accounts';
import { useAccessibleAccountsAdapter } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import Header from '../ui-elements/EntityHeader';
import { NoAccountWarning } from '../ui-elements/Warning';
import { useAuthGroups } from '../utils/hooks';
import AccountList from './AccountList';
import { MultiAccountsIcon } from './MultiAccountsIcon';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { VEEAM_FEATURE } from '../../js/config';

const Accounts = () => {
  const { pathname } = useLocation();
  const metricsAdapter = useMetricsAdapter();
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const { accounts } = useListAccounts({
    metricsAdapter,
    accessibleAccountsAdapter,
  });
  const history = useHistory();

  const { isStorageManager } = useAuthGroups();
  const { features } = useConfig();

  const displayVeeamConfiguration =
    features.includes(VEEAM_FEATURE) && isStorageManager;

  if (
    accounts.status == 'success' &&
    accounts.value.length === 0 &&
    !isStorageManager
  ) {
    return <ErrorPage401 />;
  }

  return (
    <>
      <AppContainer.ContextContainer>
        <BreadcrumbAccount pathname={pathname} />
      </AppContainer.ContextContainer>
      {accounts.status === 'loading' && (
        <Loader centered>
          <>Loading Accounts...</>
        </Loader>
      )}
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
            {accounts.value.length === 0 ? (
              displayVeeamConfiguration ? (
                <NoAccountWarning
                  buttonSection={
                    <>
                      <Button
                        label="Start Configuration for Veeam"
                        variant="primary"
                        onClick={() => history.push('/veeam/configuration')}
                      />
                      or
                      <Button
                        label="Create Account"
                        icon={<Icon name="Create-add" />}
                        variant="outline"
                        onClick={() => history.push('/create-account')}
                      />
                    </>
                  }
                />
              ) : (
                <EmptyState
                  icon="Account"
                  link="/create-account"
                  listedResource={{ singular: 'Account', plural: 'Accounts' }}
                  history={history}
                ></EmptyState>
              )
            ) : (
              <AccountList accounts={accounts.value} />
            )}
          </AppContainer.MainContent>
        </>
      )}
    </>
  );
};

export default Accounts;
