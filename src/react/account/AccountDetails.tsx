import { DefaultTheme, useTheme } from 'styled-components';
import type { Account } from '../../types/account';
import { CustomTabs } from '../ui-elements/Tabs';
import Properties from './details/Properties';
import { Warning } from '../ui-elements/Warning';
import { useParams } from 'react-router-dom';
import AccountUserList from './AccountUserList';
import AccountPoliciesList from './AccountPoliciesList';
import { AccountLocations } from './AccountLocations';
import { useAuthGroups } from '../utils/hooks';
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
  const { isStorageManager } = useAuthGroups();

  if (!account) {
    return <NotFound />;
  }

  const customTabStyle = {
    inactiveTabColor: theme.backgroundLevel2,
    activeTabColor: theme.backgroundLevel3,
    tabContentColor: theme.backgroundLevel3,
  };

  return (
    <CustomTabs
      {...customTabStyle}
      style={{
        backgroundColor: theme.backgroundLevel2,
      }}
    >
      <CustomTabs.Tab exact label="Properties" path={``}>
        <Properties account={account} />
      </CustomTabs.Tab>
      {isStorageManager && (
        <CustomTabs.Tab label="Locations" path={`locations`}>
          <AccountLocations />
        </CustomTabs.Tab>
      )}
      <CustomTabs.Tab label="Users" path={`users`}>
        <AccountUserList accountName={accountName} />
      </CustomTabs.Tab>
      <CustomTabs.Tab label="Policies" path={`policies`}>
        <AccountPoliciesList accountName={accountName} />
      </CustomTabs.Tab>
    </CustomTabs>
  );
}

export default AccountDetails;
