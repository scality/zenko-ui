import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { AppState } from '../../types/state';
import { useHistory } from 'react-router';

import ReplicationForm, { replicationSchema } from './ReplicationForm';
import * as T from '../ui-elements/TableKeyValue2';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { useMutation, useQueryClient } from 'react-query';
import type {
  Replication,
} from '../../types/config';
import { getAccountId, getClients } from '../utils/actions';
import {
  handleApiError,
  handleClientError,
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
import { workflowListQuery } from '../queries';

const CreateWorkflow = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const bucketList = useSelector(
    (state: AppState) => state.s3.listBucketsResults.list,
  );

  const useFormMethods = useForm({
    mode: 'all',
    resolver: joiResolver(replicationSchema),
    defaultValues: newReplicationForm(),
  });

  const { handleSubmit } = useFormMethods;
  const state = useSelector((state: AppState) => state);
  const mgnt = useManagementClient();
  const queryClient = useQueryClient();
  const { instanceId } = getClients(state);
  const accountId = getAccountId(state);

  const createWorkflowMutation = useMutation<
    ReplicationStreamInternalV1,
    ApiError,
    Replication
  >(
    (replication) => {
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
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(mgnt),
            accountId,
            instanceId,
            rolePathName,
          ).queryKey,
        );
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
