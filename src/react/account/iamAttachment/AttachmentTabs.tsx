import { useLocation } from 'react-router';
import { useTheme } from 'styled-components';
import { CustomTabs } from '../../ui-elements/Tabs';
import { useQueryParams } from '../../utils/hooks';
import { ResourceType } from './AttachmentConfirmationModal';

const AttachmentTabs = ({ resourceType }: { resourceType: ResourceType }) => {
  const query = useQueryParams();
  const { pathname } = useLocation();
  const theme = useTheme();
  const queryObject = Object.fromEntries(query.entries());

  const { backgroundLevel3, backgroundLevel4 } = theme.brand;
  const customTabStyle = {
    inactiveTabColor: backgroundLevel4,
    activeTabColor: backgroundLevel3,
    tabContentColor: backgroundLevel3,
    tabLineColor: backgroundLevel4,
  };
  return (
    <CustomTabs {...customTabStyle}>
      {resourceType === 'policy' && (
        <CustomTabs.Tab
          label="Users"
          path={pathname}
          query={{ ...queryObject, tab: 'users' }}
        >
          <>Attachment Table</>
        </CustomTabs.Tab>
      )}
      {(resourceType === 'policy' || resourceType === 'user') && (
        <CustomTabs.Tab
          label="Groups"
          path={pathname}
          query={{ ...queryObject, tab: 'groups' }}
        >
          <>Attachment Table</>
        </CustomTabs.Tab>
      )}
      {resourceType === 'policy' && (
        <CustomTabs.Tab
          label="Roles"
          path={pathname}
          query={{ ...queryObject, tab: 'roles' }}
        >
          <>Attachment Table</>
        </CustomTabs.Tab>
      )}
      {resourceType === 'user' && (
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
