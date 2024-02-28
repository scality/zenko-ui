import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  spacing,
  Stack,
} from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import type { Expiration, Replication } from '../../types/config';
import {
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
} from '../actions';
import * as T from '../ui-elements/TableKeyValue2';

import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { useMutation, useQueryClient } from 'react-query';
import {
  BucketWorkflowExpirationV1,
  BucketWorkflowTransitionV2,
  BucketWorkflowV1,
  ReplicationStreamInternalV1,
} from '../../js/managementClient/api';
import { ApiError } from '../../types/actions';
import {
  ReplicationForm as ReplicationFormType,
  ReplicationForm as TypeReplicationForm,
} from '../../types/replication';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import type { Workflow } from '../../types/workflow';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useManagementClient } from '../ManagementProvider';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import { workflowListQuery } from '../queries';
import { useRolePathName } from '../utils/hooks';
import { DeleteWorkflowButton } from './DeleteWorkflowButton';
import {
  ExpirationForm,
  expirationSchema,
  GeneralExpirationGroup,
} from './ExpirationForm';
import ReplicationForm, {
  disallowedPrefixes,
  GeneralReplicationGroup,
  replicationSchema,
} from './ReplicationForm';
import {
  GeneralTransitionGroup,
  TransitionForm,
  transitionSchema,
} from './TransitionForm';
import {
  convertToReplicationForm,
  convertToReplicationStream,
  generateStreamName,
  prepareExpirationQuery,
  prepareTransitionQuery,
  removeEmptyTagKeys,
} from './utils';
import { useWorkflows } from './Workflows';

type Props = {
  wfSelected: Workflow;
};

function useReplicationMutations({
  onEditSuccess,
}: {
  onEditSuccess: (replication: Replication) => void;
}) {
  const dispatch = useDispatch();
  const history = useHistory();
  const queryClient = useQueryClient();
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { account } = useCurrentAccount();
  const rolePathName = useRolePathName();
  const accountId = account?.id;
  const deleteReplicationMutation = useMutation<
    Response,
    ApiError,
    Replication
  >({
    mutationFn: (replication) => {
      const params = {
        bucketName: replication.source.bucketName,
        instanceId,
        accountId,
        workflowId: replication.streamId,
        rolePathName,
      };
      dispatch(networkStart('Deleting replication'));
      return notFalsyTypeGuard(managementClient)
        .deleteBucketWorkflowReplication(
          params.bucketName,
          params.instanceId,
          params.accountId,
          params.workflowId,
          params.rolePathName,
        )
        .finally(() => {
          dispatch(networkEnd());
        });
    },

    onSuccess: () => {
      queryClient.invalidateQueries(
        workflowListQuery(
          notFalsyTypeGuard(managementClient),
          accountId,
          instanceId,
          rolePathName,
        ).queryKey,
      );
    },
    onError: (error) => {
      try {
        dispatch(handleClientError(error));
      } catch (err) {
        dispatch(handleApiError(err as ApiError, 'byModal'));
      }
    },
  });

  const editReplicationWorkflowMutation = useMutation<
    ReplicationStreamInternalV1,
    ApiError,
    Replication
  >(
    (replication) => {
      dispatch(networkStart('Editing replication'));
      const params = {
        instanceId,
        workflow: replication,
        bucketName: replication.source.bucketName,
        accountId,
        rolePathName,
      };

      return notFalsyTypeGuard(managementClient)
        .updateBucketWorkflowReplication(
          params.workflow,
          params.bucketName,
          params.instanceId,
          params.accountId,
          replication.streamId,
          params.rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        history.replace(`./replication-${success.streamId}`);

        if (onEditSuccess) {
          //@ts-expect-error fix this when you are working on it
          onEditSuccess(success);
        }
        queryClient.invalidateQueries(
          workflowListQuery(
            managementClient,
            accountId,
            instanceId,
            rolePathName,
          ).queryKey,
        );
      },
      onError: (error) => {
        try {
          dispatch(handleClientError(error));
        } catch (err) {
          dispatch(handleApiError(err, 'byModal'));
        }
      },
    },
  );

  return { deleteReplicationMutation, editReplicationWorkflowMutation };
}

function useExpirationMutations({
  onEditSuccess,
}: {
  onEditSuccess: (expiration: BucketWorkflowExpirationV1) => void;
}) {
  const dispatch = useDispatch();
  const history = useHistory();
  const queryClient = useQueryClient();
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { account } = useCurrentAccount();
  const accountId = account.id;
  const rolePathName = useRolePathName();
  const deleteExpirationMutation = useMutation<Response, ApiError, Expiration>({
    mutationFn: (expiration) => {
      dispatch(networkStart('Deleting expiration'));
      return notFalsyTypeGuard(managementClient)
        .deleteBucketWorkflowExpiration(
          expiration.bucketName,
          instanceId,
          accountId,
          expiration.workflowId,
          rolePathName,
        )
        .finally(() => {
          dispatch(networkEnd());
        });
    },

    onSuccess: () => {
      queryClient.invalidateQueries(
        workflowListQuery(
          notFalsyTypeGuard(managementClient),
          accountId,
          instanceId,
          rolePathName,
        ).queryKey,
      );
    },
    onError: (error) => {
      try {
        dispatch(handleClientError(error));
      } catch (err) {
        dispatch(handleApiError(err as ApiError, 'byModal'));
      }
    },
  });

  const editExpirationWorkflowMutation = useMutation<
    BucketWorkflowExpirationV1,
    ApiError,
    Expiration
  >(
    (expiration) => {
      dispatch(networkStart('Editing expiration'));

      const sanitizedExpiration = removeEmptyTagKeys(expiration);

      return notFalsyTypeGuard(managementClient)
        .updateBucketWorkflowExpiration(
          sanitizedExpiration,
          sanitizedExpiration.bucketName,
          instanceId,
          accountId,
          sanitizedExpiration.workflowId,
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        history.replace(`./expiration-${success.workflowId}`);

        if (onEditSuccess) {
          onEditSuccess(success);
        }
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(managementClient),
            accountId,
            instanceId,
            rolePathName,
          ).queryKey,
        );
      },
      onError: (error) => {
        try {
          dispatch(handleClientError(error));
        } catch (err) {
          dispatch(handleApiError(err, 'byModal'));
        }
      },
    },
  );

  return { deleteExpirationMutation, editExpirationWorkflowMutation };
}

function useTransitionMutations(
  {
    onEditSuccess,
  }: {
    onEditSuccess?: (expiration: BucketWorkflowTransitionV2) => void;
  } = { onEditSuccess: undefined },
) {
  const dispatch = useDispatch();
  const history = useHistory();
  const queryClient = useQueryClient();
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { account } = useCurrentAccount();
  const accountId = account.id;
  const rolePathName = useRolePathName();
  const deleteTransitionMutation = useMutation<
    Response,
    ApiError,
    BucketWorkflowTransitionV2
  >({
    mutationFn: (expiration) => {
      dispatch(networkStart('Deleting transition'));
      return notFalsyTypeGuard(managementClient)
        .deleteBucketWorkflowTransition(
          expiration.bucketName,
          instanceId,
          accountId,
          expiration.workflowId,
          rolePathName,
        )
        .finally(() => {
          dispatch(networkEnd());
        });
    },

    onSuccess: () => {
      queryClient.invalidateQueries(
        workflowListQuery(
          notFalsyTypeGuard(managementClient),
          accountId,
          instanceId,
          rolePathName,
        ).queryKey,
      );
    },
    onError: (error) => {
      try {
        dispatch(handleClientError(error));
      } catch (err) {
        dispatch(handleApiError(err as ApiError, 'byModal'));
      }
    },
  });

  const editTransitionWorkflowMutation = useMutation<
    BucketWorkflowTransitionV2,
    ApiError,
    BucketWorkflowTransitionV2
  >(
    (transition) => {
      dispatch(networkStart('Editing transition'));

      const sanitizedExpiration = removeEmptyTagKeys(transition);

      return notFalsyTypeGuard(managementClient)
        .updateBucketWorkflowTransition(
          sanitizedExpiration,
          sanitizedExpiration.bucketName,
          instanceId,
          accountId,
          sanitizedExpiration.workflowId,
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        history.replace(`./transition-${success.workflowId}`);

        if (onEditSuccess) {
          onEditSuccess(success);
        }
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(managementClient),
            accountId,
            instanceId,
            rolePathName,
          ).queryKey,
        );
      },
      onError: (error) => {
        try {
          dispatch(handleClientError(error));
        } catch (err) {
          dispatch(handleApiError(err as ApiError, 'byModal'));
        }
      },
    },
  );
  return { deleteTransitionMutation, editTransitionWorkflowMutation };
}

export function isExpirationWorkflow(
  workflow:
    | Expiration
    | Replication
    | TypeReplicationForm
    | BucketWorkflowTransitionV2,
): workflow is Expiration {
  return (
    'type' in workflow &&
    workflow.type === BucketWorkflowV1.TypeEnum.ExpirationV1
  );
}

function isReplicationWorkflow(
  workflow:
    | Expiration
    | Replication
    | TypeReplicationForm
    | BucketWorkflowTransitionV2,
): workflow is Replication {
  return (
    'type' in workflow &&
    workflow.type === BucketWorkflowV1.TypeEnum.ReplicationV1
  );
}

export function isTransitionWorkflow(
  workflow:
    | Expiration
    | Replication
    | TypeReplicationForm
    | BucketWorkflowTransitionV2,
): workflow is BucketWorkflowTransitionV2 {
  return (
    'type' in workflow &&
    workflow.type === BucketWorkflowV1.TypeEnum.TransitionV2
  );
}

function initDefaultValues(workflow: Expiration | BucketWorkflowTransitionV2) {
  if (
    (workflow.filter &&
      (!workflow.filter.objectTags ||
        workflow.filter.objectTags.length === 0)) ||
    !workflow.filter
  ) {
    return {
      ...workflow,
      ...{
        filter: {
          objectKeyPrefix: workflow.filter?.objectKeyPrefix || '',
          objectTags: [{ key: '', value: '' }],
        },
      },
    };
  }

  return workflow;
}

function initTransitionDefaultValue(
  workflow: BucketWorkflowTransitionV2,
): BucketWorkflowTransitionV2 {
  return {
    ...initDefaultValues(workflow),
    //@ts-expect-error fix this when you are working on it
    triggerDelayDays: `${workflow.triggerDelayDays}`,
  };
}

function EditForm({
  workflow,
  workflows,
}: {
  workflow: Replication | Expiration | BucketWorkflowTransitionV2;
  workflows: {
    replications: Replication[];
    expirations: Expiration[];
    transitions: BucketWorkflowTransitionV2[];
  };
}) {
  const isPrefixMandatory =
    workflow &&
    isReplicationWorkflow(workflow) &&
    !!workflows.replications.find(
      (s) =>
        s.source.bucketName === workflow.source.bucketName &&
        s.streamId !== workflow.streamId &&
        s.source.prefix &&
        s.source.prefix !== '',
    );

  const schema =
    workflow && isExpirationWorkflow(workflow)
      ? expirationSchema
      : isTransitionWorkflow(workflow)
      ? Joi.object(transitionSchema)
      : Joi.object(
          //@ts-expect-error fix this when you are working on it
          replicationSchema(
            [],
            disallowedPrefixes(
              //@ts-expect-error fix this when you are working on it
              workflow.source.bucketName,
              workflows.replications,
            ).filter(
              (s) =>
                //@ts-expect-error fix this when you are working on it
                s !== workflow.source.prefix,
            ),
            isPrefixMandatory,
          ),
        );

  const useFormMethods = useForm({
    mode: 'all',
    resolver: async (values, context, options) => {
      const joiValidator = joiResolver(schema);
      if (workflow && isExpirationWorkflow(workflow)) {
        return joiValidator(prepareExpirationQuery(values), context, options);
      } else {
        return joiValidator(values, context, options);
      }
    },
    // fix this when you are working on it
    defaultValues: isExpirationWorkflow(workflow)
      ? initDefaultValues(workflow)
      : isTransitionWorkflow(workflow)
      ? initTransitionDefaultValue(workflow)
      : (convertToReplicationForm(workflow) as any),
  });

  const { formState, handleSubmit, reset } = useFormMethods;
  useEffect(() => {
    if (workflow && isExpirationWorkflow(workflow)) {
      // fix this when you are working on it
      reset(initDefaultValues(workflow) as any);
    } else if (workflow && isTransitionWorkflow(workflow)) {
      // fix this when you are working on it
      reset(initTransitionDefaultValue(workflow) as any);
    } else {
      // fix this when you are working on it
      reset(
        convertToReplicationForm(
          //@ts-expect-error fix this when you are working on it
          workflow,
        ) as any,
      );
    }
  }, [workflow, reset]);

  const { editReplicationWorkflowMutation } = useReplicationMutations({
    onEditSuccess: (editedWorkflow) => {
      reset(convertToReplicationForm(editedWorkflow));
    },
  });

  const { editExpirationWorkflowMutation } = useExpirationMutations({
    onEditSuccess: (editedWorkflow) => {
      //@ts-expect-error fix this when you are working on it
      reset(initDefaultValues(editedWorkflow));
    },
  });

  const { editTransitionWorkflowMutation } = useTransitionMutations({
    onEditSuccess: (editedWorkflow) => {
      reset(editedWorkflow);
    },
  });

  const onSubmit = (values: ReplicationFormType | Expiration) => {
    if (isExpirationWorkflow(values)) {
      //@ts-expect-error fix this when you are working on it
      editExpirationWorkflowMutation.mutate(prepareExpirationQuery(values));
    } else if (isTransitionWorkflow(values)) {
      editTransitionWorkflowMutation.mutate(prepareTransitionQuery(values));
    } else {
      const stream = values;
      let replicationStream = convertToReplicationStream(stream);

      if (!replicationStream.name) {
        replicationStream = {
          ...replicationStream,
          name: generateStreamName(replicationStream),
        };
      }
      editReplicationWorkflowMutation.mutate(replicationStream);
    }
  };

  return (
    <>
      <FormProvider {...useFormMethods}>
        <Form
          requireMode="all"
          banner={
            formState.isDirty && (
              <T.BannerContainer>
                <Banner
                  icon={<Icon name="Exclamation-triangle" />}
                  variant="warning"
                >
                  If you leave this screen without saving, your changes will be
                  lost.
                </Banner>
              </T.BannerContainer>
            )
          }
          layout={{ kind: 'tab' }}
          onSubmit={handleSubmit(onSubmit)}
          rightActions={
            <Stack gap="r16" style={{ paddingRight: spacing.r16 }}>
              <Button
                disabled={!formState.isDirty || !formState.isValid}
                icon={<Icon name="Save" />}
                id="create-workflow-btn"
                variant="primary"
                label="Save"
                type="submit"
              />
              <Button
                id="cancel-workflow-btn"
                variant="outline"
                disabled={!formState.isDirty}
                onClick={() => useFormMethods.reset()}
                label="Cancel"
                type="button"
              />
              <DeleteWorkflowButton workflow={workflow} />
            </Stack>
          }
        >
          <FormSection forceLabelWidth={convertRemToPixels(12)}>
            <FormGroup
              required
              label="Rule Type"
              id="type"
              content={
                isExpirationWorkflow(workflow) ? (
                  <Stack direction="horizontal">
                    <Icon name="Expiration" />
                    Expiration
                  </Stack>
                ) : isTransitionWorkflow(workflow) ? (
                  <Stack direction="horizontal">
                    <Icon name="Transition" />
                    Transition
                  </Stack>
                ) : (
                  <Stack direction="horizontal">
                    <Icon name="Replication" />
                    Replication
                  </Stack>
                )
              }
            />
          </FormSection>
          <FormSection
            forceLabelWidth={convertRemToPixels(12)}
            title={{ name: 'General' }}
          >
            {/* The required prop is a little hacky to remove the "optional" label of FormSection */}
            {isExpirationWorkflow(workflow) ? (
              <GeneralExpirationGroup required />
            ) : isTransitionWorkflow(workflow) ? (
              <GeneralTransitionGroup required />
            ) : (
              <GeneralReplicationGroup required />
            )}
          </FormSection>
          {isExpirationWorkflow(workflow) ? (
            <ExpirationForm />
          ) : isTransitionWorkflow(workflow) ? (
            <TransitionForm />
          ) : (
            <ReplicationForm isPrefixMandatory={isPrefixMandatory} />
          )}
        </Form>
      </FormProvider>
    </>
  );
}

function ConfigurationTab({ wfSelected }: Props) {
  const { workflowId } = wfSelected;
  const workflowsQuery = useWorkflows();

  const workflow = useMemo(() => {
    if (workflowsQuery.status === 'success') {
      return (
        workflowsQuery.data.replications.find(
          (r) => r.streamId === workflowId,
        ) ||
        workflowsQuery.data.expirations.find(
          (r) => r.workflowId === workflowId,
        ) ||
        workflowsQuery.data.transitions.find((r) => r.workflowId === workflowId)
      );
    }
  }, [workflowsQuery.status, workflowId]);

  if (!workflow) {
    return <></>;
  }

  return (
    <EditForm
      key={workflowId}
      //@ts-expect-error fix this when you are working on it
      workflow={workflow}
      workflows={{
        //@ts-expect-error fix this when you are working on it
        replications: workflowsQuery.data?.replications ?? [],
        //@ts-expect-error fix this when you are working on it
        expirations: workflowsQuery.data?.expirations ?? [],
        transitions: workflowsQuery.data?.transitions ?? [],
      }}
    />
  );
}

export default ConfigurationTab;
