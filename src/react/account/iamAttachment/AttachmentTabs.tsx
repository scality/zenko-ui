import { Icon, Loader } from '@scality/core-ui';
import { useReducer } from 'react';
import { useLocation, useParams } from 'react-router';
import { useTheme } from 'styled-components';
import { useQuery } from 'react-query';
import { useIAMClient } from '../../IAMProvider';
import {
  getAccountSeedsQuery,
  getListAttachedUserPoliciesQuery,
  getListEntitiesForPolicyQuery,
  getListGroupsQuery,
  getListPoliciesQuery,
  getListRolesQuery,
  getListUsersQuery,
  getUserListGroupsQuery,
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
  EntityType,
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
  initialAttachmentOperations,
}: TableProxyProps<ENTITIES_API_RESPONSE, ATTACHED_ENTITIES_API_RESPONSE>) => {
  const { data, status } = useAwsPaginatedEntities(
    getInitiallyAttachedEntitesQuery(),
    getAttachedEntitesFromResult,
  );

  if (status === 'idle' || status === 'loading') {
    return (
      <Loader>
        <div>Loading</div>
      </Loader>
    );
  }
  if (status === 'error')
    return (
      <>
        An error occured while loading entities, please retry later and if the
        error persists, contact your support.
      </>
    );
  ///TODO handle loading and errors
  return (
    <AttachmentTable
      getAllEntitiesPaginatedQuery={getAllEntitiesPaginatedQuery}
      getEntitiesFromResult={getEntitiesFromResult}
      initiallyAttachedEntities={data || []}
      onAttachmentsOperationsChanged={onAttachmentsOperationsChanged}
      initialAttachmentOperations={initialAttachmentOperations}
    />
  );
};

const AttachmentTabs = ({
  resourceType,
  resourceId,
  resourceName,
  onAttachmentsOperationsChanged,
}: {
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  onAttachmentsOperationsChanged: (
    attachmentOperations: AttachmentOperation[],
  ) => void;
}) => {
  const query = useQueryParams();
  const { pathname } = useLocation();
  const theme = useTheme();
  const queryObject = Object.fromEntries(query.entries());
  const IAMClient = useIAMClient();
  const { accountName } = useParams<{ accountName: string }>();
  const [attachmentOperations, setAttachmentOperations] = useReducer(
    (
      state: Record<EntityType, AttachmentOperation[]>,
      action: { type: EntityType; attachmentOperations: AttachmentOperation[] },
    ) => {
      const newState = { ...state, [action.type]: action.attachmentOperations };
      onAttachmentsOperationsChanged(
        Object.values(newState).reduce(
          (agg, current) => [...agg, ...current],
          [],
        ),
      );
      return newState;
    },
    { user: [], role: [], policy: [], group: [] },
  );
  const { backgroundLevel3, backgroundLevel4 } = theme.brand;
  const customTabStyle = {
    inactiveTabColor: backgroundLevel4,
    activeTabColor: backgroundLevel3,
    tabContentColor: backgroundLevel3,
    tabLineColor: backgroundLevel4,
  };

  const { data: accountSeeds } = useQuery(getAccountSeedsQuery());
  const policyRolePair =
    accountSeeds?.filter(
      (seed) => seed.permissionPolicy.policyName === resourceName,
    ) || [];

  return (
    <CustomTabs {...customTabStyle}>
      {resourceType === 'policy' && (
        <CustomTabs.Tab
          label="Users"
          path={pathname}
          query={{ ...queryObject, tab: null }}
          icon={<Icon name="User" />}
        >
          <AttachmentTableProxy
            getAllEntitiesPaginatedQuery={() =>
              getListUsersQuery(accountName, IAMClient)
            }
            getEntitiesFromResult={(response) => {
              return response.Users.map((user) => {
                return {
                  name: user.UserName,
                  id: user.UserName,
                  type: 'user',
                };
              });
            }}
            getInitiallyAttachedEntitesQuery={() =>
              getListEntitiesForPolicyQuery(resourceId, IAMClient)
            }
            getAttachedEntitesFromResult={(response) => {
              return (
                response.PolicyUsers?.map((user) => {
                  return {
                    name: user.UserName || '',
                    id: user.UserName || '',
                    type: 'user',
                  };
                }) || []
              );
            }}
            initialAttachmentOperations={attachmentOperations['user']}
            onAttachmentsOperationsChanged={(attachmentOperations) =>
              setAttachmentOperations({ type: 'user', attachmentOperations })
            }
          />
        </CustomTabs.Tab>
      )}
      {resourceType === 'policy' && (
        <CustomTabs.Tab
          label="Groups"
          path={pathname}
          query={{ ...queryObject, tab: 'groups' }}
          icon={<Icon name="Group" />}
        >
          <AttachmentTableProxy
            getAllEntitiesPaginatedQuery={() =>
              getListGroupsQuery(accountName, IAMClient)
            }
            getEntitiesFromResult={(response) => {
              return (
                response.Groups?.map((group) => {
                  return {
                    name: group.GroupName || '',
                    id: group.GroupName || '',
                    type: 'group',
                  };
                }) || []
              );
            }}
            getInitiallyAttachedEntitesQuery={() =>
              getListEntitiesForPolicyQuery(resourceId, IAMClient)
            }
            getAttachedEntitesFromResult={(response) => {
              return (
                response.PolicyGroups?.map((group) => {
                  return {
                    name: group.GroupName || '',
                    id: group.GroupName || '',
                    type: 'group',
                  };
                }) || []
              );
            }}
            initialAttachmentOperations={attachmentOperations['group']}
            onAttachmentsOperationsChanged={(attachmentOperations) =>
              setAttachmentOperations({ type: 'group', attachmentOperations })
            }
          />
        </CustomTabs.Tab>
      )}
      {resourceType === 'user' && (
        <CustomTabs.Tab
          label="Groups"
          path={pathname}
          query={{ ...queryObject, tab: null }}
          icon={<Icon name="Group" />}
        >
          <AttachmentTableProxy
            getAllEntitiesPaginatedQuery={() =>
              getListGroupsQuery(accountName, IAMClient)
            }
            getEntitiesFromResult={(response) => {
              return (
                response.Groups?.map((group) => {
                  return {
                    name: group.GroupName || '',
                    id: group.GroupName || '',
                    type: 'group',
                  };
                }) || []
              );
            }}
            getInitiallyAttachedEntitesQuery={() =>
              getUserListGroupsQuery(resourceId, IAMClient)
            }
            getAttachedEntitesFromResult={(response) => {
              return response.Groups.map((group) => {
                return {
                  name: group.GroupName,
                  id: group.GroupName,
                  type: 'group',
                };
              });
            }}
            initialAttachmentOperations={attachmentOperations['group']}
            onAttachmentsOperationsChanged={(attachmentOperations) =>
              setAttachmentOperations({ type: 'group', attachmentOperations })
            }
          />
        </CustomTabs.Tab>
      )}
      {resourceType === 'policy' && (
        <CustomTabs.Tab
          label="Roles"
          path={pathname}
          query={{ ...queryObject, tab: 'roles' }}
          icon={<Icon name="Role" />}
        >
          <AttachmentTableProxy
            getAllEntitiesPaginatedQuery={() =>
              getListRolesQuery(accountName, IAMClient)
            }
            getEntitiesFromResult={(response) => {
              return (
                response.Roles?.map((role) => {
                  return {
                    name: role.RoleName || '',
                    id: role.RoleName || '',
                    arn: role.Arn,
                    type: 'role',
                  };
                }) || []
              );
            }}
            getInitiallyAttachedEntitesQuery={() =>
              getListEntitiesForPolicyQuery(resourceId, IAMClient)
            }
            getAttachedEntitesFromResult={(response) => {
              return (
                response.PolicyRoles?.map((role) => {
                  const disableDetach = !!policyRolePair.find(
                    (pair) => pair.role.roleName === role.RoleName,
                  );
                  return {
                    name: role.RoleName || '',
                    id: role.RoleName || '',
                    type: 'role',
                    disableDetach,
                  };
                }) || []
              );
            }}
            initialAttachmentOperations={attachmentOperations['role']}
            onAttachmentsOperationsChanged={(attachmentOperations) =>
              setAttachmentOperations({ type: 'role', attachmentOperations })
            }
          />
        </CustomTabs.Tab>
      )}
      {resourceType === 'user' && (
        <CustomTabs.Tab
          label="Policies"
          path={pathname}
          query={{ ...queryObject, tab: 'policies' }}
          icon={<Icon name="Policy" />}
        >
          <AttachmentTableProxy
            getAllEntitiesPaginatedQuery={() =>
              getListPoliciesQuery(accountName, IAMClient)
            }
            getEntitiesFromResult={(response) => {
              return (
                response.Policies?.map((policy) => {
                  return {
                    name: policy.PolicyName || '',
                    id: policy.Arn || '',
                    type: 'policy',
                  };
                }) || []
              );
            }}
            getInitiallyAttachedEntitesQuery={() =>
              getListAttachedUserPoliciesQuery(
                resourceId,
                accountName,
                IAMClient,
              )
            }
            getAttachedEntitesFromResult={(response) => {
              return (
                response.AttachedPolicies?.map((policy) => {
                  return {
                    name: policy.PolicyName || '',
                    id: policy.PolicyArn || '',
                    type: 'policy',
                  };
                }) || []
              );
            }}
            initialAttachmentOperations={attachmentOperations['policy']}
            onAttachmentsOperationsChanged={(attachmentOperations) =>
              setAttachmentOperations({ type: 'policy', attachmentOperations })
            }
          />
        </CustomTabs.Tab>
      )}
    </CustomTabs>
  );
};

export default AttachmentTabs;
