import { useLocation, useRouteMatch } from 'react-router';
import { useTheme } from 'styled-components';
import { CustomTabs } from '../ui-elements/Tabs';
import { useQueryParams } from '../utils/hooks';

const AttachmentTabs = () => {
  const query = useQueryParams();
  const { pathname } = useLocation();
  const theme = useTheme();
  const queryObject = Object.fromEntries(query.entries());

  const isAttachToUser = useRouteMatch(
    '/accounts/:accountName/users/:IAMUserName/attachments',
  );
  const isAttachToPolicy = useRouteMatch(
    '/accounts/:accountName/policies/:policyArn/attachments',
  );

  const { backgroundLevel3, backgroundLevel4 } = theme.brand;
  const customTabStyle = {
    inactiveTabColor: backgroundLevel4,
    activeTabColor: backgroundLevel3,
    tabContentColor: backgroundLevel3,
    tabLineColor: backgroundLevel4,
  };
  return (
    <CustomTabs {...customTabStyle}>
      {isAttachToPolicy && (
        <CustomTabs.Tab
          label="Users"
          path={pathname}
          query={{ ...queryObject, tab: 'users' }}
        >
          <>Attachment Table</>
        </CustomTabs.Tab>
      )}
      {(isAttachToPolicy || isAttachToUser) && (
        <CustomTabs.Tab
          label="Groups"
          path={pathname}
          query={{ ...queryObject, tab: 'groups' }}
        >
          <>Attachment Table</>
        </CustomTabs.Tab>
      )}
      {isAttachToPolicy && (
        <CustomTabs.Tab
          label="Roles"
          path={pathname}
          query={{ ...queryObject, tab: 'roles' }}
        >
          <>Attachment Table</>
        </CustomTabs.Tab>
      )}
      {isAttachToUser && (
        <CustomTabs.Tab
          label="Policies"
          path={pathname}
          query={{ ...queryObject, tab: 'policies' }}
        >
          <>Attachment Table</>
        </CustomTabs.Tab>
      )}
    </CustomTabs>
  );
};

export default AttachmentTabs;
