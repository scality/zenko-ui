import React from 'react';
import { useAwsPaginatedEntities } from './utils/IAMhooks';
import IAMClient from '../js/IAMClient';

export const getUserAccessKeysQuery = (userName: string, IAMClient: IAMClient) => ({
  queryKey: ['listIAMUserAccessKey', userName],
  queryFn: (marker: string) => IAMClient.listAccessKeys(userName, marker),
  enabled: IAMClient !== null,
  refetchOnMount: false,
  refetchOnWindowFocus: false
});

export const getUserListGroupsQuery = (userName: string, IAMClient: IAMClient) => ({
  queryKey: ['listIAMUserGroups', userName],
  queryFn: () => IAMClient.listGroupsForUser(userName),
  enabled: IAMClient !== null,
});

export const useUserAccessKeysQuery = (userName: string, IAMClient: IAMClient) => {
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

export const useUserListGroupsQuery = (userName: string, IAMClient: IAMClient) => {
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