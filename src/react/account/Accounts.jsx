// @flow
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AccountList from './AccountList';
import type { AppState } from '../../types/state';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import * as L from '../ui-elements/ListLayout5';
import Header from '../ui-elements/EntityHeader';
import MultiAccountsLogo from '../../../public/assets/logo-multi-accounts.svg';

const Accounts = () => {
  const { pathname } = useLocation();
  const accounts = useSelector(
    (state: AppState) => state.configuration.latest.users,
  );

  return (
    <L.Container>
      <L.BreadcrumbContainer>
        <BreadcrumbAccount pathname={pathname} />
      </L.BreadcrumbContainer>
      <Header
        icon={<img src={MultiAccountsLogo} alt="Multi Accounts Logo" />}
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
