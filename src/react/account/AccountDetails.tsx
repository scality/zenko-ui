import { DefaultTheme, useTheme } from 'styled-components';
import React from 'react';
import type { Account } from '../../types/account';
import { CustomTabs } from '../ui-elements/Tabs';
import Locations from '../backend/location/Locations';
import Properties from './details/Properties';
import { Warning } from '../ui-elements/Warning';
import { useRouteMatch, useParams } from 'react-router-dom';
import AccountUserList from './AccountUserList';
import AccountPoliciesList from './AccountPoliciesList';
type Props = {
  account: Account | null | undefined;
};

const NotFound = () => (
  <Warning
    iconClass="fas fa-3x fa-exclamation-triangle"
    title="Account not found."
  />
);

function AccountDetails({ account }: Props) {
  const theme: DefaultTheme = useTheme();
  const { accountName } = useParams<{ accountName: string }>();

  const { url } = useRouteMatch();

  if (!account) {
    return <NotFound />;
  }

  const customTabStyle = {
    inactiveTabColor: theme.brand.backgroundLevel2,
    activeTabColor: theme.brand.backgroundLevel3,
    tabContentColor: theme.brand.backgroundLevel3,
  };
  return (
    <CustomTabs
      {...customTabStyle}
      style={{
        backgroundColor: theme.brand.backgroundLevel2,
      }}
    >
      <CustomTabs.Tab exact label="Properties" path={url}>
        <Properties account={account} />
      </CustomTabs.Tab>
      <CustomTabs.Tab label="Locations" path={`${url}/locations`}>
        <Locations />
      </CustomTabs.Tab>
      <CustomTabs.Tab label="Users" path={`${url}/users`}>
        <AccountUserList accountName={accountName} />
      </CustomTabs.Tab>
      <CustomTabs.Tab label="Policies" path={`${url}/policies`}>
        <AccountPoliciesList accountName={accountName} />
      </CustomTabs.Tab>
    </CustomTabs>
  );
}

export default AccountDetails;
