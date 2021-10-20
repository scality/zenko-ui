// @flow
import * as L from '../ui-elements/ListLayout';
import React, { useMemo } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AccountContent from './AccountContent';
import AccountList from './AccountList';
import type { AppState } from '../../types/state';
import { EmptyStateContainer } from '../ui-elements/Container';
import { Warning } from '../ui-elements/Warning';
import { push } from 'connected-react-router';

const sortByDate = (objs, desc) =>
  objs.sort((a, b) =>
    a.createDate > b.createDate
      ? desc
        ? 1
        : -1
      : b.createDate > a.createDate
      ? desc
        ? -1
        : 1
      : 0,
  );

const Accounts = () => {
  const dispatch = useDispatch();

  const { accountName: accountNameParam } = useParams();

  const accounts = useSelector(
    (state: AppState) => state.configuration.latest.users,
  );
  const accountList = useMemo(() => sortByDate(accounts, false), [accounts]);
  const accountIndex = useMemo(
    () => accountList.findIndex(a => a.userName === accountNameParam),
    [accountList, accountNameParam],
  );

  // empty state.
  if (accountList.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          iconClass="fas fa-5x fa-wallet"
          title="Create your first account."
          btnTitle="Create Account"
          btnAction={() => dispatch(push('/create-account'))}
        />
      </EmptyStateContainer>
    );
  }

  // redirect to the first account.
  if (!accountNameParam) {
    return <Redirect to={`/accounts/${accountList[0].userName}`} />;
  }

  return (
    <L.Container>
      <AccountList accountList={accountList} accountIndex={accountIndex} />
      <AccountContent account={accountList[accountIndex]} />
    </L.Container>
  );
};

export default Accounts;
