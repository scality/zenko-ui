// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useAwsPaginatedEntities } from './utils/IAMhooks';
import { useIAMClient } from './IAMProvider';

export const getUserAccessKeysQuery = (userName, IAMClient) => ({
  queryKey: ['listIAMUserAccessKey', userName],
  queryFn: (_ctx, marker) => IAMClient.listAccessKeys(userName, marker),
  enabled: IAMClient !== null,
});

export const getUserListGroupsQuery = (userName, IAMClient) => ({
  queryKey: ['listIAMUserGroups', userName],
  queryFn: (_ctx, marker) => IAMClient.listGroupsForUser(userName, marker),
  enabled: IAMClient !== null,
});

export const useUserAccessKeysQuery = (userName, IAMClient) => {
  const {
    data: accessKeysResult,
    status: userAccessKeyStatus,
    firstPageStatus: firstPageUserAccessKeyStatus,
  } = useAwsPaginatedEntities(
    getUserAccessKeysQuery(userName, IAMClient),
    data => data.AccessKeyMetadata,
  );
  return { firstPageUserAccessKeyStatus, accessKeysResult, userAccessKeyStatus };
};

export const useUserListGroupsQuery = (userName, IAMClient) => {
  const {
    data: listGroupsResult,
    status: listGroupsStatus,
    firstPageStatus: firstPageUserAccessKeyStatus,
  } = useAwsPaginatedEntities(
    getUserListGroupsQuery(userName, IAMClient),
    data => data.Groups,
  );
  return { firstPageUserAccessKeyStatus, listGroupsResult, listGroupsStatus };
};
