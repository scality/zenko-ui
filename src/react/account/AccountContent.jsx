// @flow
import React, { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as L from '../ui-elements/ListLayout5';
import AccountDetails from './AccountDetails';
import AccountHead from './AccountHead';
import type { AppState } from '../../types/state';
import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';

function AccountContent() {
  const { accountName: accountNameParam } = useParams();
  const { pathname } = useLocation();
  const accounts = useSelector(
    (state: AppState) => state.configuration.latest.users,
  );

  const account = useMemo(
    () => accounts.find(a => a.userName === accountNameParam),
    [accounts, accountNameParam],
  );

  return (
    <L.Container>
      <L.BreadcrumbContainer>
        <BreadcrumbAccount pathname={pathname} />
      </L.BreadcrumbContainer>
      <AccountHead />
      <L.Content>
        <AccountDetails account={account} />
      </L.Content>
    </L.Container>
  );
}

export default AccountContent;
