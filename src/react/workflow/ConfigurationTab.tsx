import { useMemo } from 'react';
import styled from 'styled-components';
import Joi from '@hapi/joi';
import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';

import type {
  Locations,
  Replication,
  ReplicationStreams,
} from '../../types/config';
import FormContainer from '../ui-elements/FormLayout';
import * as T from '../ui-elements/TableKeyValue2';
import {
  closeWorkflowDeleteModal,
  deleteReplication,
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
  openWorkflowDeleteModal,
} from '../actions';
import type { AppState } from '../../types/state';

import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import ReplicationForm from './ReplicationForm';
import type { S3BucketList } from '../../types/s3';
import type { Workflow } from '../../types/workflow';
import { joiResolver } from '@hookform/resolvers';
import {
  convertToReplicationForm,
  convertToReplicationStream,
  generateStreamName,
  newReplicationForm,
} from './utils';
import { useMutation, useQueryClient } from 'react-query';
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
  replications: ReplicationStreams;
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
  replications,
  bucketList,
  locations,
}: Props) {
  const dispatch = useDispatch();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { workflowId } = wfSelected;
  const isDeleteModalOpen = useSelector(
    (state: AppState) => state.uiWorkflows.showWorkflowDeleteModal,
  );
  const replication = useMemo(() => {
    return replications.find((r) => r.streamId === workflowId);
  }, [replications, workflowId]);

  const handleOpenDeleteModal = () => {
    dispatch(openWorkflowDeleteModal());
  };

  const handleCloseDeleteModal = () => {
    dispatch(closeWorkflowDeleteModal());
  };

  const handleDeleteWorkflow = () => {
    dispatch(deleteReplication(replication));
  };

  const schema = Joi.object({
    streamId: Joi.string().label('Id').allow(''),
    streamVersion: Joi.number().label('Version').optional(),
    // streamName: Joi.string().label('Name').min(4).allow('').messages({
    //     'string.min': '"Name" should have a minimum length of {#limit}',
    // }),
    enabled: Joi.boolean().label('State').required(),
    sourceBucket: Joi.object({
      value: Joi.string().label('Bucket Name').required(),
      label: Joi.string(),
      disabled: Joi.boolean(),
      location: Joi.string(),
    }),
    sourcePrefix: Joi.string().label('Prefix').allow(''),
    destinationLocation: Joi.object({
      value: Joi.string().label('Destination Location Name').required(),
      label: Joi.string(),
    }),
  });

  const state = useSelector((state: AppState) => state);
  const mgnt = useManagementClient();

  const useFormMethods = useForm({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: newReplicationForm(),
  });

  const { formState, handleSubmit, reset } = useFormMethods;
  const { instanceId } = getClients(state);
  const accountId = getAccountId(state);
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
        dispatch(handleClientError(error));
        dispatch(handleApiError(error, 'byModal'));
      },
    },
  );

  const onSubmit = (values: ReplicationFormType) => {
    const stream = values;
    let s = convertToReplicationStream(stream);

    if (!s.name) {
      s = { ...s, name: generateStreamName(s) };
    }
    eidtWorkflowMutation.mutate(s);
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
            <ReplicationForm
              replications={replications}
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
                onClick={() => history.push('./')}
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
