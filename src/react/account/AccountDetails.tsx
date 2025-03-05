import { Icon } from '@scality/core-ui';
import { Tabs } from '@scality/core-ui/dist/next';
import { useLocation, useParams } from 'react-router';
import { useTheme } from 'styled-components';
import { Account } from '../../types/account';
import { Warning } from '../ui-elements/Warning';
import { useAuthGroups } from '../utils/hooks';
import { AccountLocations } from './AccountLocations';
import AccountPoliciesList from './AccountPoliciesList';
import AccountUserList from './AccountUserList';
import Properties from './details/Properties';
import { useEffect } from 'react';
import { useBasenameRelativeNavigate } from '@scality/module-federation';

type Props = {
  account: Account | null | undefined;
};

const NotFound = () => (
  <Warning
    centered={true}
    icon={<Icon name="Exclamation-triangle" size="3x" />}
    title="Account not found."
  />
);

function AccountDetails({ account }: Props) {
  const theme = useTheme();
  const { accountName } = useParams<{ accountName: string }>();
  const { isStorageManager } = useAuthGroups();
  const { pathname } = useLocation();
  const navigate = useBasenameRelativeNavigate();

  const customTabStyle = {
    inactiveTabColor: theme.backgroundLevel2,
    activeTabColor: theme.backgroundLevel3,
    tabContentColor: theme.backgroundLevel3,
  };

  const baseUrl = pathname.substring(0, pathname.lastIndexOf('/'));

  useEffect(() => {
    if (
      !(
        pathname.includes('/properties') ||
        pathname.includes('/locations') ||
        pathname.includes('/users') ||
        pathname.includes('/policies')
      )
    ) {
      navigate(`/accounts/${accountName}/properties`, { replace: true });
    }
  }, []);

  if (!account) {
    return <NotFound />;
  }

  return (
    <Tabs {...customTabStyle} tabLineColor={theme.backgroundLevel2}>
      <Tabs.Tab
        exact
        label="Properties"
        path={`${baseUrl}/properties`}
        withoutPadding
      >
        <Properties account={account} />
      </Tabs.Tab>
      {isStorageManager && (
        <Tabs.Tab
          label="Locations"
          path={`${baseUrl}/locations`}
          withoutPadding
        >
          <AccountLocations />
        </Tabs.Tab>
      )}
      <Tabs.Tab label="Users" path={`${baseUrl}/users`} withoutPadding>
        <AccountUserList accountName={accountName} />
      </Tabs.Tab>
      <Tabs.Tab label="Policies" path={`${baseUrl}/policies`} withoutPadding>
        <AccountPoliciesList accountName={accountName} />
      </Tabs.Tab>
    </Tabs>
  );
}

export default AccountDetails;
