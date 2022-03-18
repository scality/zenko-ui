import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm } from 'react-hook-form';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { AppState } from '../../types/state';
import { useHistory } from 'react-router';

import ReplicationForm from './ReplicationForm';
import * as T from '../ui-elements/TableKeyValue2';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { MutationFunction, useMutation } from 'react-query';
import type {
  Replication,
  Replication as ReplicationStream,
} from '../../types/config';
import { getAccountId, getClients } from '../utils/actions';
import {
  handleApiError,
  handleClientError,
  handleErrorMessage,
  networkEnd,
  networkStart,
} from '../actions';
import { rolePathName } from '../../js/IAMClient';
import {
  convertToReplicationStream,
  generateStreamName,
  newReplicationForm,
} from './utils';
import { useManagementClient } from '../ManagementProvider';
import { ApiError } from '../../types/actions';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { ReplicationStreamInternalV1 } from '../../js/managementClient/api';

const CreateWorkflow = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const replications = useSelector(
    (state: AppState) => state.workflow.replications,
  );
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const bucketList = useSelector(
    (state: AppState) => state.s3.listBucketsResults.list,
  );

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

  const useFormMethods = useForm({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: newReplicationForm(),
  });

  const { handleSubmit } = useFormMethods;
  const state = useSelector((state: AppState) => state);
  const mgnt = useManagementClient();
  const createWorkflowMutation = useMutation<
    ReplicationStreamInternalV1,
    ApiError,
    Replication
  >(
    (replication) => {
      const { instanceId } = getClients(state);
      const accountId = getAccountId(state);
      dispatch(networkStart('Creating replication'));
      const params = {
        instanceId,
        workflow: replication,
        bucketName: replication.source.bucketName,
        accountId,
        rolePathName,
      };

      return notFalsyTypeGuard(mgnt)
        .createBucketWorkflowReplication(
          params.workflow,
          params.bucketName,
          params.accountId,
          params.instanceId,
          params.rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        history.push(`./replication-${success.streamId}`);
      },
      onError: (error) => {
        dispatch(handleClientError(error));
        dispatch(handleApiError(error, 'byModal'));
      },
    },
  );

  const onSubmit = (values) => {
    const stream = values;
    let s = convertToReplicationStream(stream);

    if (!s.name) {
      s = { ...s, name: generateStreamName(s) };
    }

    createWorkflowMutation.mutate(s);
  };

  return (
    <FormProvider {...useFormMethods}>
      <FormContainer>
        <F.Form onSubmit={handleSubmit(onSubmit)}>
          <F.Title>Create New Workflow</F.Title>
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
            workflow={null}
            replications={replications}
            bucketList={bucketList}
            locations={locations}
          />
          <T.Footer>
            <Button
              disabled={loading}
              id="cancel-workflow-btn"
              style={{
                marginRight: spacing.sp24,
              }}
              variant="outline"
              onClick={() => history.push('./')}
              label="Cancel"
            />
            <Button
              disabled={loading}
              id="create-workflow-btn"
              variant="primary"
              label="Create"
            />
          </T.Footer>
        </F.Form>
      </FormContainer>
    </FormProvider>
  );
};

export default CreateWorkflow;
