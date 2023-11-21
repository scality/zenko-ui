import {
  AppContainer,
  ErrorPage401,
  ErrorPage500,
  Icon,
} from '@scality/core-ui';
import { useHistory, useLocation } from 'react-router-dom';

import { Button } from '@scality/core-ui/dist/next';
import { useListAccounts } from '../next-architecture/domain/business/accounts';
import { useAccessibleAccountsAdapter } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { useMetricsAdapter } from '../next-architecture/ui/MetricsAdapterProvider';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import { EmptyStateContainer } from '../ui-elements/Container';
import Header from '../ui-elements/EntityHeader';
import { NoAccountWarning, Warning } from '../ui-elements/Warning';
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
            {accounts.value.length === 0 ? (
              <EmptyStateContainer>
                {displayVeeamConfiguration ? (
                  <NoAccountWarning
                    buttonSection={
                      <>
                        <Button
                          label="Start Configuration for Veeam"
                          variant="primary"
                          onClick={() => history.push('/veeam/configuration')}
                        />
                        <p>or</p>
                        <Button
                          label="Create Account"
                          variant="outline"
                          onClick={() => history.push('/create-account')}
                        />
                      </>
                    }
                  />
                ) : (
                  <Warning
                    centered
                    icon={<Icon name="Account" size="5x" />}
                    title={`You don't have any account, please create your first one.`}
                    btnTitle="Create Account"
                    btnAction={() => history.push('/create-account')}
                  />
                )}
              </EmptyStateContainer>
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
