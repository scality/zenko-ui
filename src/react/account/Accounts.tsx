import {
  AppContainer,
  ErrorPage401,
  ErrorPage500,
  Icon,
  Loader,
} from '@scality/core-ui';
import { useLocation } from 'react-router';

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

import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useState } from 'react';
import ISVModal from '../ISV/components/Modal/ISVModal';

const Accounts = () => {
  const { pathname } = useLocation();
  const metricsAdapter = useMetricsAdapter();
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const { accounts } = useListAccounts({
    metricsAdapter,
    accessibleAccountsAdapter,
  });
  const navigate = useBasenameRelativeNavigate();
  const [isISVModalOpen, setIsISVModalOpen] = useState(false);

  const { isStorageManager } = useAuthGroups();

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
            <ISVModal isOpen={isISVModalOpen} setIsOpen={setIsISVModalOpen} />
            {accounts.value.length === 0 ? (
              <NoAccountWarning
                buttonSection={
                  <>
                    <Button
                      label="Start Configuration for ISV"
                      variant="primary"
                      onClick={() => setIsISVModalOpen(true)}
                    />
                    or
                    <Button
                      label="Create Account"
                      icon={<Icon name="Create-add" />}
                      variant="outline"
                      onClick={() => navigate('/create-account')}
                    />
                  </>
                }
              />
            ) : (
              <AccountList
                accounts={accounts.value}
                setIsISVModalOpen={setIsISVModalOpen}
              />
            )}
          </AppContainer.MainContent>
        </>
      )}
    </>
  );
};

export default Accounts;
