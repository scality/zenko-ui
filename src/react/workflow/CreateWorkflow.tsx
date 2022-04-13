import { useDispatch, useSelector } from 'react-redux';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { AppState } from '../../types/state';
import { useHistory } from 'react-router';
import * as L from '../ui-elements/ListLayout5';
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
import { Breadcrumb } from '../ui-elements/Breadcrumb';
import { useLocation } from 'react-router-dom';
import { useQueryParams } from '../utils/hooks';

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
  const BUCKETNAME_QUERY_PARAM = 'bucket';
  const queryParams = useQueryParams();
  const bucketName = queryParams.get(BUCKETNAME_QUERY_PARAM) || '';

  const useFormMethods = useForm({
    mode: 'all',
    resolver: async (values, context, options) => {
      const joiValidator = joiResolver(
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
      );
      if (values.type === 'replication') {
        return joiValidator(values, context, options);
      } else {
        return joiValidator(
          {
            type: values.type,
            replication: values.replication,
            expiration: prepareExpirationQuery(values.expiration),
          },
          context,
          options,
        );
      }
    },
    defaultValues: {
      type: 'select',
      replication: newReplicationForm(bucketName),
      expiration: newExpiration(bucketName),
    },
  });

  const { handleSubmit, control, watch, formState } = useFormMethods;
  const type = watch('type');
  const state = useSelector((state: AppState) => state);
  const accountName = useSelector(
    (state: AppState) =>
      state.auth.selectedAccount && state.auth.selectedAccount.userName,
  );
  const accounts = useSelector(
    (state: AppState) => state.configuration.latest.users,
  );
  const { pathname } = useLocation();
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
        if (bucketName !== '') {
          // redirectly to the bucket list -> workflow tab
          history.push(`/buckets/${bucketName}?tab=workflow`);
        } else {
          history.push(`./replication-${success.streamId}`);
        }
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
        if (bucketName !== '') {
          history.push(`/buckets/${bucketName}?tab=workflow`);
        } else {
          history.push(`./expiration-${success.workflowId}`);
        }
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
    <>
      <L.BreadcrumbContainer>
        <Breadcrumb
          accounts={accounts}
          accountName={accountName}
          pathname={pathname}
        />
      </L.BreadcrumbContainer>
      <FormProvider {...useFormMethods}>
        <FormContainer>
          <F.Form onSubmit={handleSubmit(onSubmit)}>
            <F.Title>Create New Workflow</F.Title>
            <T.Group>
              <T.GroupContent>
                <T.Row>
                  <T.Key principal={true}> Type </T.Key>
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
    </>
  );
};

export default CreateWorkflow;
