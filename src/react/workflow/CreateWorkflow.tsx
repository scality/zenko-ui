import { useDispatch, useSelector } from 'react-redux';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { Box, Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { AppState } from '../../types/state';
import { useHistory } from 'react-router';
import * as L from '../ui-elements/ListLayout5';
import ReplicationForm, { replicationSchema } from './ReplicationForm';
import * as T from '../ui-elements/TableKeyValue2';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { useMutation, useQueryClient } from 'react-query';
import type { Replication } from '../../types/config';
import { getClients } from '../utils/actions';
import {
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
} from '../actions';
import {
  convertToReplicationStream,
  generateStreamName,
  newExpiration,
  newReplicationForm,
  newTransition,
  prepareExpirationQuery,
  prepareTransitionQuery,
  removeEmptyTagKeys,
} from './utils';
import { useManagementClient } from '../ManagementProvider';
import { ApiError } from '../../types/actions';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import {
  BucketWorkflowExpirationV1,
  BucketWorkflowTransitionV2,
  ReplicationStreamInternalV1,
} from '../../js/managementClient/api';
import { workflowListQuery } from '../queries';
import Joi from '@hapi/joi';
import { ExpirationForm, expirationSchema } from './ExpirationForm';
import { Select } from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import { Breadcrumb } from '../ui-elements/Breadcrumb';
import { useQueryParams, useRolePathName } from '../utils/hooks';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import { TransitionForm, transitionSchema } from './TransitionForm';

const OptionIcon = ({ iconClass }: { iconClass: string }) => (
  <Box width="2rem" display="flex" alignItems="center" justifyContent="center">
    <span className={iconClass} />
  </Box>
);

const CreateWorkflow = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const locations = useSelector(
    (state: AppState) => state.configuration.latest?.locations,
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

  const defaultFormValues = {
    type: 'select',
    replication: newReplicationForm(bucketName),
    expiration: newExpiration(bucketName),
    transition: newTransition(bucketName),
  };
  const useFormMethods = useForm({
    mode: 'all',
    resolver: async (values, context, options) => {
      const schema = Joi.object({
        type: Joi.string().valid('replication', 'expiration', 'transition'),
        replication: Joi.when('type', {
          is: Joi.equal('replication'),
          then: Joi.object(replicationSchema),
          otherwise: Joi.valid(),
        }),
        transition: Joi.when('type', {
          is: Joi.equal('transition'),
          then: Joi.object(transitionSchema),
          otherwise: Joi.valid(),
        }),
        expiration: Joi.when('type', {
          is: Joi.equal('expiration'),
          then: expirationSchema,
          otherwise: Joi.valid(),
        }),
      });
      const joiValidator = joiResolver(schema);
      if (values.type === 'replication' || values.type === 'transition') {
        return joiValidator(values, context, options);
      } else {
        return joiValidator(
          {
            type: values.type,
            replication: values.replication,
            transition: values.transition,
            expiration: prepareExpirationQuery(values.expiration),
          },
          context,
          options,
        );
      }
    },
    defaultValues: defaultFormValues,
  });

  useFormMethods.getValues;

  const { handleSubmit, control, watch, formState } = useFormMethods;
  const type = watch('type');
  const state = useSelector((state: AppState) => state);
  const { account } = useCurrentAccount();
  const accountId = account?.id;
  const rolePathName = useRolePathName();
  const mgnt = useManagementClient();
  const queryClient = useQueryClient();
  const { instanceId } = getClients(state);
  const isValid = formState.isValid;

  const createReplicationWorkflowMutation = useMutation<
    ReplicationStreamInternalV1,
    ApiError,
    Replication
  >(
    async (replication) => {
      dispatch(networkStart('Creating replication'));

      return notFalsyTypeGuard(mgnt)
        .createBucketWorkflowReplication(
          replication,
          replication.source.bucketName,
          accountId!,
          instanceId!,
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(mgnt),
            accountId!,
            instanceId!,
            rolePathName,
          ).queryKey,
        );
        if (bucketName !== '') {
          // redirectly to the bucket list -> workflow tab
          history.push(
            `/accounts/${account?.Name}/buckets/${bucketName}?tab=workflow`,
          );
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
    BucketWorkflowExpirationV1
  >(
    async (expiration) => {
      dispatch(networkStart('Creating expiration'));
      const sanitizedExpiration = removeEmptyTagKeys(expiration);
      return notFalsyTypeGuard(mgnt)
        .createBucketWorkflowExpiration(
          sanitizedExpiration,
          sanitizedExpiration.bucketName,
          accountId!,
          instanceId!,
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(mgnt),
            accountId!,
            instanceId!,
            rolePathName,
          ).queryKey,
        );
        if (bucketName !== '') {
          history.push(
            `/accounts/${account?.Name}/buckets/${bucketName}?tab=workflow`,
          );
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

  const createTransitionWorkflowMutation = useMutation<
    BucketWorkflowTransitionV2,
    ApiError,
    BucketWorkflowTransitionV2
  >(
    async (transition) => {
      dispatch(networkStart('Creating transition'));
      const sanitizedTransition = removeEmptyTagKeys(transition);
      return notFalsyTypeGuard(mgnt)
        .createBucketWorkflowTransition(
          prepareTransitionQuery(sanitizedTransition),
          sanitizedTransition.bucketName,
          accountId!,
          instanceId!,
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(mgnt),
            accountId!,
            instanceId!,
            rolePathName,
          ).queryKey,
        );
        if (bucketName !== '') {
          history.push(
            `/accounts/${account?.Name}/buckets/${bucketName}?tab=workflow`,
          );
        } else {
          history.push(`./transition-${success.workflowId}`);
        }
      },
      onError: (error) => {
        dispatch(handleClientError(error));
        dispatch(handleApiError(error, 'byModal'));
      },
    },
  );

  const onSubmit: SubmitHandler<typeof defaultFormValues> = (values) => {
    if (values.type === 'replication') {
      const stream = values.replication;
      let s = convertToReplicationStream(stream);

      if (!s.name) {
        s = { ...s, name: generateStreamName(s) };
      }

      createReplicationWorkflowMutation.mutate(s);
    } else if (values.type === 'expiration') {
      createExpirationWorkflowMutation.mutate(
        prepareExpirationQuery(values.expiration),
      );
    } else {
      createTransitionWorkflowMutation.mutate(values.transition);
    }
  };

  return (
    <>
      <L.BreadcrumbContainer>
        <Breadcrumb />
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
                      render={({
                        field: { onChange, onBlur, value: type },
                      }) => {
                        return (
                          <Select
                            onBlur={onBlur}
                            value={type}
                            onChange={(value) => onChange(value)}
                          >
                            <Select.Option
                              value={'replication'}
                              icon={<OptionIcon iconClass="fas fa-coins" />}
                            >
                              Replication
                            </Select.Option>
                            <Select.Option
                              value={'expiration'}
                              icon={<OptionIcon iconClass="fas fa-stopwatch" />}
                            >
                              Expiration
                            </Select.Option>
                            <Select.Option
                              value={'transition'}
                              icon={<OptionIcon iconClass="fas fa-rocket" />}
                            >
                              Transition
                            </Select.Option>
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
            {type === 'transition' && (
              <TransitionForm
                bucketList={bucketList}
                locations={locations}
                prefix={'transition.'}
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
                disabled={loading || !isValid}
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
