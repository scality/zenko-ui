// @flow
import { useTheme } from 'styled-components';
import type { Account } from '../../types/account';
import { CustomTabs } from '../ui-elements/Tabs';
import Locations from '../backend/location/Locations';
import Properties from './details/Properties';
import React from 'react';
import { Warning } from '../ui-elements/Warning';
import { useRouteMatch } from 'react-router-dom';

type Props = {
  account: ?Account,
};

const NotFound = () => (
  <Warning
    iconClass="fas fa-3x fa-exclamation-triangle"
    title="Account not found."
  />
);

function AccountDetails({ account }: Props) {
  const { url } = useRouteMatch();
  const theme = useTheme();

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
      style={{ backgroundColor: theme.brand.backgroundLevel2 }}
    >
      <CustomTabs.Tab exact label="Properties" path={url}>
        <Properties account={account} />
      </CustomTabs.Tab>
      <CustomTabs.Tab label="Locations" path={`${url}/locations`}>
        <Locations />
      </CustomTabs.Tab>
    </CustomTabs>
  );
}

export default AccountDetails;
