import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';

import type { Expiration, Locations, Replication } from '../../types/config';
import FormContainer from '../ui-elements/FormLayout';
import * as T from '../ui-elements/TableKeyValue2';
import {
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
} from '../actions';
import type { AppState } from '../../types/state';

import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import ReplicationForm, { replicationSchema } from './ReplicationForm';
import type { S3BucketList } from '../../types/s3';
import type { Workflow } from '../../types/workflow';
import { joiResolver } from '@hookform/resolvers/joi';
import {
  convertToReplicationForm,
  convertToReplicationStream,
  generateExpirationName,
  generateStreamName,
  prepareExpirationQuery,
} from './utils';
import { useMutation, useQueryClient } from 'react-query';
import {
  BucketWorkflowV1,
  BucketWorkflowExpirationV1,
  ReplicationStreamInternalV1,
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
import { ExpirationForm, expirationSchema } from './ExpirationForm';
import { useWorkflows } from './Workflows';
import {
  useCurrentAccount,
} from '../DataServiceRoleProvider';
import { useRolePathName } from '../utils/hooks';

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

  const removeEmptyTagKeys = (expiration: Expiration) => {
    if (expiration.filter && expiration.filter.objectTags) {
      const sanitizedTags = expiration.filter.objectTags.filter((tag) => tag.key !== '');
      expiration.filter.objectTags.splice(0, expiration.filter.objectTags.length);
      expiration.filter.objectTags.push(...sanitizedTags);

      return { ...expiration, ...{ filter: { objectKeyPrefix: expiration.filter.objectKeyPrefix, objectTags: sanitizedTags }}};
    }

    return expiration;
  };

  const editExpirationWorkflowMutation = useMutation<
    BucketWorkflowExpirationV1,
    ApiError,
    Expiration
  >(
    (expiration) => {
      dispatch(networkStart('Editing expiration'));
      
      const sanitizedExpiration = removeEmptyTagKeys(expiration)

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

function isExpirationWorkflow(
  workflow: Expiration | Replication | TypeReplicationForm,
): workflow is Expiration {
  return (
    'type' in workflow &&
    workflow.type === BucketWorkflowV1.TypeEnum.ExpirationV1
  );
}

function initDefaultValues(workflow: Expiration) {
  if (workflow.filter && (!workflow.filter.objectTags || workflow.filter.objectTags.length === 0)) {
    return { ... workflow, ...{ filter: { objectKeyPrefix: workflow.filter.objectKeyPrefix, objectTags: [ { key: '', value: '' }]}}};
  }

  return workflow;
}

function EditForm({
  workflow,
  bucketList,
  locations,
}: {
  workflow: Replication | Expiration;
  bucketList: S3BucketList;
  locations: Locations;
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const schema =
    workflow && isExpirationWorkflow(workflow)
      ? expirationSchema
      : Joi.object(replicationSchema);

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
    } else if (workflow && !isExpirationWorkflow(workflow)) {
      deleteReplicationMutation.mutate(workflow);
    }
  };

  const onSubmit = (values: ReplicationFormType | Expiration) => {
    if (isExpirationWorkflow(values)) {
      editExpirationWorkflowMutation.mutate(prepareExpirationQuery(values));
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
    <div>
      <DeleteConfirmation
        approve={handleDeleteWorkflow}
        cancel={handleCloseDeleteModal}
        show={isDeleteModalOpen}
        titleText={`Permanently remove the following Workflow: ${
          workflow.name ||
          (isExpirationWorkflow(workflow)
            ? generateExpirationName(workflow)
            : generateStreamName(workflow))
        } ?`}
      />
      <ConfigurationHeader>
        {formState.isDirty ? (
          <T.BannerContainer>
            <Banner
              icon={<i className="fas fa-exclamation-triangle" />}
              variant="warning"
            >
              If you leave this screen without saving, your changes will be
              lost.
            </Banner>
          </T.BannerContainer>
        ) : (
          <div />
        )}

        <Button
          icon={<i className="fas fa-trash" />}
          label="Delete Workflow"
          variant="danger"
          onClick={handleOpenDeleteModal}
          type="button"
        />
      </ConfigurationHeader>
      <FormProvider {...useFormMethods}>
        <FormContainer
          style={{ backgroundColor: 'transparent', overflowX: 'hidden' }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <T.Group>
              <T.GroupContent>
                <T.Row>
                  <T.Key principal={true}> Type </T.Key>
                  {isExpirationWorkflow(workflow) ? (
                    <T.Value>
                      <i className="fas fa-stopwatch" />
                      Expiration
                    </T.Value>
                  ) : (
                    <T.Value>
                      <i className="fas fa-coins" />
                      Replication
                    </T.Value>
                  )}
                </T.Row>
              </T.GroupContent>
            </T.Group>
            {isExpirationWorkflow(workflow) ? (
              <ExpirationForm bucketList={bucketList} locations={locations} />
            ) : (
              <ReplicationForm bucketList={bucketList} locations={locations} />
            )}
            <T.Footer>
              <Button
                id="cancel-workflow-btn"
                style={{
                  marginRight: spacing.sp24,
                  marginBottom: spacing.sp20,
                }}
                variant="outline"
                disabled={!formState.isDirty}
                onClick={() => useFormMethods.reset()}
                label="Cancel"
                type="button"
              />
              <Button
                disabled={!formState.isDirty || !formState.isValid}
                style={{
                  marginBottom: spacing.sp20,
                }}
                icon={<i className="fas fa-save" />}
                id="create-workflow-btn"
                variant="primary"
                label="Save"
                type="submit"
              />
            </T.Footer>
          </form>
        </FormContainer>
      </FormProvider>
    </div>
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
        workflowsQuery.data.expirations.find((r) => r.workflowId === workflowId)
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
    />
  );
}

export default ConfigurationTab;
