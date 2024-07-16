import { useTheme } from 'styled-components';
import { Account } from '../../types/account';
import { Tabs } from '@scality/core-ui/dist/next';
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
    //@ts-expect-error fix this when you are working on it
    iconClass="fas fa-3x fa-exclamation-triangle"
    title="Account not found."
  />
);

function AccountDetails({ account }: Props) {
  const theme = useTheme();
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
    <Tabs {...customTabStyle} tabLineColor={theme.backgroundLevel2}>
      <Tabs.Tab exact label="Properties" path={``} withoutPadding>
        <Properties account={account} />
      </Tabs.Tab>
      {isStorageManager && (
        <Tabs.Tab label="Locations" path={`locations`} withoutPadding>
          <AccountLocations />
        </Tabs.Tab>
      )}
      <Tabs.Tab label="Users" path={`users`} withoutPadding>
        <AccountUserList accountName={accountName} />
      </Tabs.Tab>
      <Tabs.Tab label="Policies" path={`policies`} withoutPadding>
        <AccountPoliciesList accountName={accountName} />
      </Tabs.Tab>
    </Tabs>
  );
}

export default AccountDetails;
