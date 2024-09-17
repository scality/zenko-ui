import { Icon } from '@scality/core-ui';
import { Tabs } from '@scality/core-ui/dist/next';
import { useParams } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { Account } from '../../types/account';
import { Warning } from '../ui-elements/Warning';
import { useAuthGroups } from '../utils/hooks';
import { AccountLocations } from './AccountLocations';
import AccountPoliciesList from './AccountPoliciesList';
import AccountUserList from './AccountUserList';
import Properties from './details/Properties';

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
