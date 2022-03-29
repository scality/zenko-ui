import { useDispatch, useSelector } from 'react-redux';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { AppState } from '../../types/state';
import { useHistory } from 'react-router';

import ReplicationForm, { replicationSchema } from './ReplicationForm';
import * as T from '../ui-elements/TableKeyValue2';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { useMutation, useQueryClient } from 'react-query';
import type { Expiration, Replication } from '../../types/config';
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
  newExpiration,
  newReplicationForm,
  prepareExpirationQuery,
} from './utils';
import { useManagementClient } from '../ManagementProvider';
import { ApiError } from '../../types/actions';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import {
  BucketWorkflowExpirationV1,
  ReplicationStreamInternalV1,
} from '../../js/managementClient/api';
import { workflowListQuery } from '../queries';
import Joi from '@hapi/joi';
import { ExpirationForm, expirationSchema } from './ExpirationForm';
import Select, {
  Option,
} from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import React from 'react';

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
    resolver: joiResolver(
      Joi.object({
        type: Joi.string().valid('replication', 'expiration'),
        replication: Joi.when('type', {
          is: Joi.equal('replication'),
          then: Joi.object(replicationSchema),
          otherwise: Joi.valid(),
        }),
        expiration: Joi.when('type', {
          is: Joi.equal('expiration'),
          then: expirationSchema,
          otherwise: Joi.valid(),
        }),
      }),
    ),
    defaultValues: {
      type: 'select',
      replication: newReplicationForm(),
      expiration: newExpiration(),
    },

  });

  const { handleSubmit, control, watch, formState } = useFormMethods;
  const type = watch('type');
  const state = useSelector((state: AppState) => state);
  const mgnt = useManagementClient();
  const queryClient = useQueryClient();
  const { instanceId } = getClients(state);
  const accountId = getAccountId(state);

  const createReplicationWorkflowMutation = useMutation<
    ReplicationStreamInternalV1,
    ApiError,
    Replication
  >(
    (replication) => {
      dispatch(networkStart('Creating replication'));

      return notFalsyTypeGuard(mgnt)
        .createBucketWorkflowReplication(
          replication,
          replication.source.bucketName,
          accountId,
          instanceId,
          rolePathName,
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

  const createExpirationWorkflowMutation = useMutation<
    BucketWorkflowExpirationV1,
    ApiError,
    Expiration
  >(
    (expiration) => {
      dispatch(networkStart('Creating expiration'));

      return notFalsyTypeGuard(mgnt)
        .createBucketWorkflowExpiration(
          expiration,
          expiration.bucketName,
          accountId,
          instanceId,
          rolePathName,
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
        history.push(`./expiration-${success.workflowId}`);
      },
      onError: (error) => {
        dispatch(handleClientError(error));
        dispatch(handleApiError(error, 'byModal'));
      },
    },
  );

  const onSubmit = (values) => {
    if (values.type === 'replication') {
      const stream = values.replication;
      let s = convertToReplicationStream(stream);

      if (!s.name) {
        s = { ...s, name: generateStreamName(s) };
      }

      createReplicationWorkflowMutation.mutate(s);
    } else {
      createExpirationWorkflowMutation.mutate(
        prepareExpirationQuery(values.expiration),
      );
    }
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
                  <Controller
                    control={control}
                    name="type"
                    render={({ field: { onChange, value: type } }) => {
                      return (
                        <Select
                          value={type}
                          onChange={(value) => onChange(value)}
                        >
                          {type === 'select' ? <Option
                            value={'select'}
                          >
                            Select...
                          </Option> : <></>}
                          <Option
                            value={'replication'}
                            icon={<i className="fas fa-coins" />}
                          >
                            Replication
                          </Option>
                          <Option
                            value={'expiration'}
                            icon={<i className="fas fa-stopwatch" />}
                          >
                            Expiration
                          </Option>
                        </Select>
                      );
                    }}
                  />
                </T.Value>
              </T.Row>
            </T.GroupContent>
          </T.Group>
          {type === 'replication' && (
            <ReplicationForm
              bucketList={bucketList}
              locations={locations}
              prefix={'replication.'}
              isCreateMode={true}
            />
          )}
          {type === 'expiration' && (
            <ExpirationForm
              bucketList={bucketList}
              locations={locations}
              prefix={'expiration.'}
            />
          )}
          <T.Footer>
            <Button
              disabled={loading}
              id="cancel-workflow-btn"
              style={{
                marginRight: spacing.sp24,
              }}
              type="button"
              variant="outline"
              onClick={() => history.push('./')}
              label="Cancel"
            />
            <Button
              icon={<i className="fas fa-plus" />}
              disabled={loading || !formState.isValid}
              id="create-workflow-btn"
              variant="primary"
              label="Create"
              type="submit"
            />
          </T.Footer>
        </F.Form>
      </FormContainer>
    </FormProvider>
  );
};

export default CreateWorkflow;
