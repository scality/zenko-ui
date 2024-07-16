import { Dispatch } from 'redux';
import { UiFacingApi } from '../../js/managementClient/api';
import { ApiError } from '../../types/actions';
import { InstanceStatus } from '../../types/stats';
import { handleClientError } from '../actions';

export const getInstanceStatusQuery = (
  dispatch: Dispatch<any>,
  managementClient: UiFacingApi,
  instanceId: string,
) => ({
  queryKey: ['instanceStatus', instanceId],
  queryFn: () => {
    //@ts-expect-error fix this when you are working on it
    return managementClient.getLatestInstanceStatus(
      instanceId,
    ) as InstanceStatus;
  },
  onError: (error: ApiError) => {
    dispatch(handleClientError(error));
  },
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});
