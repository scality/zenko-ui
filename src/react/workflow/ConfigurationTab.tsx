import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';

import type {
  Locations,
  Replication,
} from '../../types/config';
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
import { joiResolver } from '@hookform/resolvers';
import {
  convertToReplicationForm,
  convertToReplicationStream,
  generateStreamName,
  newReplicationForm,
} from './utils';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { ReplicationStreamInternalV1 } from '../../js/managementClient/api';
import { ApiError } from '../../types/actions';
import { getAccountId, getClients } from '../utils/actions';
import { rolePathName } from '../../js/IAMClient';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { ReplicationForm as ReplicationFormType } from '../../types/replication';
import { workflowListQuery } from '../queries';

type Props = {
  wfSelected: Workflow;
  bucketList: S3BucketList;
  locations: Locations;
  showEditWorkflowNotification: boolean;
  loading: boolean;
};

const ConfigurationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

function ConfigurationTab({
  wfSelected,
  bucketList,
  locations,
}: Props) {
  const dispatch = useDispatch();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { workflowId } = wfSelected;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const mgnt = useManagementClient();
  const state = useSelector((state: AppState) => state);
  const { instanceId } = getClients(state);
  const accountId = getAccountId(state);

  const replicationsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId,
      instanceId,
      rolePathName,
    ),
    select: (workflows) => workflows.filter(w => w.replication).map(w => w.replication),
  });

  const replication = useMemo(() => {
    if (replicationsQuery.status === 'success') {
      return replicationsQuery.data.find((r) => r.streamId === workflowId);
    }
    
  }, [replicationsQuery.status, workflowId]);

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const deleteMutation = useMutation<Response, ApiError, Replication>({
    mutationFn: (replication) => {
      const params = {
        bucketName: replication.source.bucketName,
        instanceId,
        accountId,
        workflowId: replication.streamId,
        rolePathName,
      };
      dispatch(networkStart('Deleting replication'));
      setIsDeleteModalOpen(false);
      return notFalsyTypeGuard(mgnt)
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
          notFalsyTypeGuard(mgnt),
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

  const handleDeleteWorkflow = () => {
    if (replication) {
      deleteMutation.mutate(replication);
    }
  };

  const useFormMethods = useForm({
    mode: 'all',
    resolver: joiResolver(replicationSchema),
    defaultValues: newReplicationForm(),
  });

  const { formState, handleSubmit, reset } = useFormMethods;
  
  const eidtWorkflowMutation = useMutation<
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

      return notFalsyTypeGuard(mgnt)
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

        reset(convertToReplicationForm(success));
        queryClient.invalidateQueries(
          workflowListQuery(mgnt, accountId, instanceId, rolePathName).queryKey,
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

  const onSubmit = (values: ReplicationFormType) => {
    const stream = values;
    let replicationStream = convertToReplicationStream(stream);

    if (!replicationStream.name) {
      replicationStream = { ...replicationStream, name: generateStreamName(replicationStream) };
    }
    eidtWorkflowMutation.mutate(replicationStream);
  };

  // TODO: Adapt it to handle the other workflow types; For now only replication workflow is supported.
  return (
    <div>
      <DeleteConfirmation
        approve={handleDeleteWorkflow}
        cancel={handleCloseDeleteModal}
        show={isDeleteModalOpen}
        titleText={`Permanently remove the following Rule: ${wfSelected.name} ?`}
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
        <FormContainer style={{ backgroundColor: 'transparent' }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <T.Group>
              <T.GroupContent>
                <T.Row>
                  <T.Key principal={true}> Rule Type </T.Key>
                  <T.Value>
                    <i className="fas fa-coins" />
                    Replication
                  </T.Value>
                </T.Row>
              </T.GroupContent>
            </T.Group>
            <ReplicationForm
              workflow={replication}
              bucketList={bucketList}
              locations={locations}
            />
            <T.Footer>
              <Button
                id="cancel-workflow-btn"
                style={{
                  marginRight: spacing.sp24,
                }}
                variant="outline"
                onClick={() => history.replace()}
                label="Cancel"
              />
              <Button
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

export default ConfigurationTab;
