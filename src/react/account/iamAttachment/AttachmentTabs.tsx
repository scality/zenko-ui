import { useLocation, useParams } from 'react-router';
import { useTheme } from 'styled-components';
import {
  getListEntitiesForPolicyQuery,
  getListUsersQuery,
} from '../../queries';
import { CustomTabs } from '../../ui-elements/Tabs';
import { useQueryParams } from '../../utils/hooks';
import {
  AWS_PAGINATED_QUERY,
  useAwsPaginatedEntities,
} from '../../utils/IAMhooks';
import { AttachmentTable, AttachmentTableProps } from './AttachmentTable';
import {
  AttachableEntity,
  AttachmentOperation,
  ResourceType,
} from './AttachmentTypes';

type TableProxyProps<
  ENTITIES_API_RESPONSE extends {
    Marker?: string;
  },
  ATTACHED_ENTITIES_API_RESPONSE extends {
    Marker?: string;
  },
> = Omit<
  AttachmentTableProps<ENTITIES_API_RESPONSE>,
  'initiallyAttachedEntities'
> & {
  getAttachedEntitesFromResult: (
    response: ATTACHED_ENTITIES_API_RESPONSE,
  ) => AttachableEntity[];
  getInitiallyAttachedEntitesQuery: () => AWS_PAGINATED_QUERY<
    ATTACHED_ENTITIES_API_RESPONSE,
    AttachableEntity
  >;
};

const AttachmentTableProxy = <
  ENTITIES_API_RESPONSE extends {
    Marker?: string;
  },
  ATTACHED_ENTITIES_API_RESPONSE extends {
    Marker?: string;
  },
>({
  getAllEntitiesPaginatedQuery,
  getEntitiesFromResult,
  getInitiallyAttachedEntitesQuery,
  getAttachedEntitesFromResult,
  onAttachmentsOperationsChanged,
}: TableProxyProps<ENTITIES_API_RESPONSE, ATTACHED_ENTITIES_API_RESPONSE>) => {
  const { data } = useAwsPaginatedEntities(
    getInitiallyAttachedEntitesQuery(),
    getAttachedEntitesFromResult,
  );

  if (!data) return <></>;
  ///TODO handle loading and errors
  return (
    <AttachmentTable
      getAllEntitiesPaginatedQuery={getAllEntitiesPaginatedQuery}
      getEntitiesFromResult={getEntitiesFromResult}
      initiallyAttachedEntities={data}
      onAttachmentsOperationsChanged={onAttachmentsOperationsChanged}
    />
  );
};

const AttachmentTabs = ({
  resourceType,
  resourceId,
  onAttachmentsOperationsChanged,
}: {
  resourceType: ResourceType;
  resourceId: string;
  onAttachmentsOperationsChanged: (
    attachmentOperations: AttachmentOperation[],
  ) => void;
}) => {
  const query = useQueryParams();
  const { pathname } = useLocation();
  const theme = useTheme();
  const queryObject = Object.fromEntries(query.entries());
  const { accountName } = useParams<{ accountName: string }>();
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
          <AttachmentTableProxy
            getAllEntitiesPaginatedQuery={() => getListUsersQuery(accountName)}
            getEntitiesFromResult={(response) => {
              return response.Users.map((user) => {
                return {
                  name: user.UserName,
                  arn: user.Arn,
                  type: 'user',
                };
              });
            }}
            getInitiallyAttachedEntitesQuery={() =>
              getListEntitiesForPolicyQuery(resourceId)
            }
            getAttachedEntitesFromResult={(response) => {
              return (
                response.PolicyUsers?.map((user) => {
                  return {
                    name: user.UserName || '',
                    arn: user.UserName || '', /// TODO think about it tomorow ;orning
                    type: 'user',
                  };
                }) || []
              );
            }}
            onAttachmentsOperationsChanged={console.log}
          />
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
