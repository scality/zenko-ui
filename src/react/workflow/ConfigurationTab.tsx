import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
} from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import type { Expiration, Locations, Replication } from '../../types/config';
import * as T from '../ui-elements/TableKeyValue2';
import {
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
} from '../actions';
import type { AppState } from '../../types/state';

import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import ReplicationForm, {
  disallowedPrefixes,
  GeneralReplicationGroup,
  replicationSchema,
} from './ReplicationForm';
import type { S3BucketList } from '../../types/s3';
import type { Workflow } from '../../types/workflow';
import { joiResolver } from '@hookform/resolvers/joi';
import {
  convertToReplicationForm,
  convertToReplicationStream,
  generateExpirationName,
  generateStreamName,
  generateTransitionName,
  prepareExpirationQuery,
  prepareTransitionQuery,
  removeEmptyTagKeys,
} from './utils';
import { useMutation, useQueryClient } from 'react-query';
import {
  BucketWorkflowV1,
  BucketWorkflowExpirationV1,
  ReplicationStreamInternalV1,
  BucketWorkflowTransitionV2,
} from '../../js/managementClient/api';
import { ApiError } from '../../types/actions';
import { getClients } from '../utils/actions';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import {
  ReplicationForm as TypeReplicationForm,
  ReplicationForm as ReplicationFormType,
} from '../../types/replication';
import { workflowListQuery } from '../queries';
import Joi from '@hapi/joi';
import {
  ExpirationForm,
  expirationSchema,
  GeneralExpirationGroup,
} from './ExpirationForm';
import { useWorkflows } from './Workflows';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { useRolePathName } from '../utils/hooks';
import {
  GeneralTransitionGroup,
  TransitionForm,
  transitionSchema,
} from './TransitionForm';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';

type Props = {
  wfSelected: Workflow;
  bucketList: S3BucketList;
  locations: Locations;
};

const ConfigurationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

function useReplicationMutations({
  onEditSuccess,
}: {
  onEditSuccess: (replication: Replication) => void;
}) {
  const dispatch = useDispatch();
  const history = useHistory();
  const queryClient = useQueryClient();
  const managementClient = useManagementClient();
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
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
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
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
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
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

function isExpirationWorkflow(
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

function isTransitionWorkflow(
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
    triggerDelayDays: `${workflow.triggerDelayDays}`,
  };
}

function EditForm({
  workflow,
  bucketList,
  locations,
  workflows,
}: {
  workflow: Replication | Expiration | BucketWorkflowTransitionV2;
  bucketList: S3BucketList;
  locations: Locations;
  workflows: {
    replications: Replication[];
    expirations: Expiration[];
    transitions: BucketWorkflowTransitionV2[];
  };
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
          replicationSchema(
            [],
            disallowedPrefixes(
              workflow.source.bucketName,
              workflows.replications,
            ).filter((s) => s !== workflow.source.prefix),
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
    defaultValues: isExpirationWorkflow(workflow)
      ? initDefaultValues(workflow)
      : isTransitionWorkflow(workflow)
      ? initTransitionDefaultValue(workflow)
      : convertToReplicationForm(workflow),
  });

  const { formState, handleSubmit, reset } = useFormMethods;

  const { deleteReplicationMutation, editReplicationWorkflowMutation } =
    useReplicationMutations({
      onEditSuccess: (editedWorkflow) => {
        reset(convertToReplicationForm(editedWorkflow));
      },
    });

  const { deleteExpirationMutation, editExpirationWorkflowMutation } =
    useExpirationMutations({
      onEditSuccess: (editedWorkflow) => {
        reset(initDefaultValues(editedWorkflow));
      },
    });

  const { deleteTransitionMutation, editTransitionWorkflowMutation } =
    useTransitionMutations({
      onEditSuccess: (editedWorkflow) => {
        reset(editedWorkflow);
      },
    });

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDeleteWorkflow = () => {
    setIsDeleteModalOpen(false);
    if (workflow && isExpirationWorkflow(workflow)) {
      deleteExpirationMutation.mutate(workflow);
    } else if (workflow && isTransitionWorkflow(workflow)) {
      deleteTransitionMutation.mutate(workflow);
    } else {
      deleteReplicationMutation.mutate(workflow);
    }
  };

  const onSubmit = (values: ReplicationFormType | Expiration) => {
    if (isExpirationWorkflow(values)) {
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
      <DeleteConfirmation
        approve={handleDeleteWorkflow}
        cancel={handleCloseDeleteModal}
        show={isDeleteModalOpen}
        titleText={`Permanently remove the following Workflow: ${
          workflow.name ||
          (isExpirationWorkflow(workflow)
            ? generateExpirationName(workflow)
            : isTransitionWorkflow(workflow)
            ? generateTransitionName(workflow)
            : generateStreamName(workflow))
        } ?`}
      />
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
            <Stack gap="r16">
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
              <Button
                icon={<Icon name="Delete" />}
                label="Delete Workflow"
                variant="danger"
                onClick={handleOpenDeleteModal}
                type="button"
              />
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
            <ExpirationForm bucketList={bucketList} locations={locations} />
          ) : isTransitionWorkflow(workflow) ? (
            <TransitionForm bucketList={bucketList} locations={locations} />
          ) : (
            <ReplicationForm
              bucketList={bucketList}
              locations={locations}
              isPrefixMandatory={isPrefixMandatory}
            />
          )}
        </Form>
      </FormProvider>
    </>
  );
}

function ConfigurationTab({ wfSelected, bucketList, locations }: Props) {
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
      workflow={workflow}
      bucketList={bucketList}
      locations={locations}
      workflows={{
        replications: workflowsQuery.data?.replications ?? [],
        expirations: workflowsQuery.data?.expirations ?? [],
        transitions: workflowsQuery.data?.transitions ?? [],
      }}
    />
  );
}

export default ConfigurationTab;
