import { useToast } from '@scality/core-ui';
import { useMutation, useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import { BucketWorkflowTransitionV2 } from '../../js/managementClient/api';
import { ApiError } from '../../types/actions';
import { Expiration, Replication } from '../../types/config';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useManagementClient } from '../ManagementProvider';
import { networkEnd, networkStart } from '../actions';
import { useAuth, useInstanceId } from '../next-architecture/ui/AuthProvider';
import { workflowListQuery } from '../queries';
import { errorParser } from '../utils';
import { useRolePathName } from '../utils/hooks';

export enum WorkflowRule {
  Replication = 'replication',
  Expiration = 'expiration',
  Transition = 'transition',
}

export const useDeleteWorkflow = (
  workflowRuleType: WorkflowRule,
  closeModal?: (isClose: boolean) => void,
) => {
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { account } = useCurrentAccount();
  const rolePathName = useRolePathName();
  const accountId = account?.id || '';

  const { showToast } = useToast();

  type WorkflowRuleType<T> = T extends WorkflowRule.Replication
    ? Replication
    : T extends WorkflowRule.Expiration
    ? Expiration
    : T extends WorkflowRule.Transition
    ? BucketWorkflowTransitionV2
    : never;

  const isWorkflowRuleType = <T extends WorkflowRule>(
    wkf: Replication | Expiration | BucketWorkflowTransitionV2,
    type: T,
  ): wkf is WorkflowRuleType<T> => {
    if (type === WorkflowRule.Replication) {
      return (wkf as Replication).streamId !== undefined;
    } else if (type === WorkflowRule.Expiration) {
      return (wkf as Expiration).workflowId !== undefined;
    } else {
      return (wkf as BucketWorkflowTransitionV2).workflowId !== undefined;
    }
  };

  const deleteMutation = useMutation<
    Response,
    ApiError,
    WorkflowRuleType<WorkflowRule>
  >({
    mutationFn: (workflow) => {
      const params = {
        bucketName: isWorkflowRuleType(workflow, WorkflowRule.Replication)
          ? workflow.source.bucketName
          : workflow.bucketName,
        instanceId,
        accountId,
        workflowId: isWorkflowRuleType(workflow, WorkflowRule.Replication)
          ? workflow.streamId
          : workflow.workflowId,
        rolePathName,
      };

      dispatch(networkStart(`Deleting ${workflowRuleType}`));
      const deleteBucketWorkflowFn = () => {
        if (workflowRuleType === WorkflowRule.Replication) {
          return notFalsyTypeGuard(
            managementClient,
          ).deleteBucketWorkflowReplication(
            params.bucketName,
            params.instanceId,
            params.accountId,
            params.workflowId ?? '',
            params.rolePathName,
          );
        } else if (workflowRuleType === WorkflowRule.Expiration) {
          return notFalsyTypeGuard(
            managementClient,
          ).deleteBucketWorkflowExpiration(
            params.bucketName,
            params.instanceId,
            params.accountId,
            params.workflowId ?? '',
            params.rolePathName,
          );
        } else {
          return notFalsyTypeGuard(
            managementClient,
          ).deleteBucketWorkflowTransition(
            params.bucketName,
            params.instanceId,
            params.accountId,
            params.workflowId ?? '',
            params.rolePathName,
          );
        }
      };

      return deleteBucketWorkflowFn().finally(() => {
        dispatch(networkEnd());
      });
    },

    onSuccess: () => {
      closeModal?.(false);
      queryClient.invalidateQueries(
        workflowListQuery(
          notFalsyTypeGuard(managementClient),
          accountId,
          instanceId,
          rolePathName,
          getToken,
        ).queryKey,
      );
      showToast({
        open: true,
        status: 'success',
        message: `Workflow deleted successfully`,
      });
    },
    onError: (error) => {
      closeModal?.(false);
      showToast({
        open: true,
        status: 'error',
        message: errorParser(error).message,
      });
    },
  });

  return deleteMutation;
};
