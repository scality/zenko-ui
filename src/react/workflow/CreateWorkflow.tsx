import { useDispatch, useSelector } from 'react-redux';
import {
  Controller,
  FormProvider,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { Box, Button } from '@scality/core-ui/dist/next';
import { AppState } from '../../types/state';
import { useHistory } from 'react-router';
import ReplicationForm, {
  disallowedPrefixes,
  GeneralReplicationGroup,
  isTransientLocation,
  replicationSchema,
} from './ReplicationForm';
import { useMutation, useQuery, useQueryClient } from 'react-query';
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
import {
  ExpirationForm,
  expirationSchema,
  GeneralExpirationGroup,
} from './ExpirationForm';
import { Select } from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import { useQueryParams, useRolePathName } from '../utils/hooks';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import {
  GeneralTransitionGroup,
  TransitionForm,
  transitionSchema,
} from './TransitionForm';
import { Form, FormGroup, FormSection, Stack } from '@scality/core-ui';
import {
  Icon,
  IconName,
} from '@scality/core-ui/dist/components/icon/Icon.component';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';

const OptionIcon = ({ icon }: { icon: IconName }) => (
  <Box width="2rem" display="flex" alignItems="center" justifyContent="center">
    <Icon name={icon} />
  </Box>
);

const CreateWorkflow = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const locations =
    useSelector((state: AppState) => state.configuration.latest?.locations) ??
    {};

  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const bucketList = useSelector(
    (state: AppState) => state.s3.listBucketsResults.list,
  );
  const BUCKETNAME_QUERY_PARAM = 'bucket';
  const queryParams = useQueryParams();
  const bucketName = queryParams.get(BUCKETNAME_QUERY_PARAM) || '';
  const state = useSelector((state: AppState) => state);
  const { account } = useCurrentAccount();
  const accountId = account?.id;
  const rolePathName = useRolePathName();
  const mgnt = useManagementClient();
  const queryClient = useQueryClient();
  const { instanceId } = getClients(state);

  const defaultFormValues = {
    type: 'select',
    replication: newReplicationForm(bucketName),
    expiration: newExpiration(bucketName),
    transition: newTransition(bucketName),
  };
  const replicationsQuery = useQuery({
    ...workflowListQuery(
      notFalsyTypeGuard(mgnt),
      accountId,
      instanceId,
      rolePathName,
    ),
    select: (workflows) =>
      workflows.filter((w) => w.replication).map((w) => w.replication),
  });

  const useFormMethods = useForm({
    mode: 'onTouched',
    resolver: async (values, context, options) => {
      const bucketName = values.replication.sourceBucket;
      const streams = replicationsQuery.data ?? [];
      const unallowedBucketName = streams.flatMap((s) => {
        const { prefix, bucketName } = s.source;
        if (!prefix || prefix === '') return [bucketName];
        return [];
      });
      const prefixMandatory = !!streams.find((s) => {
        const { prefix } = s.source;
        return prefix && prefix !== '' && bucketName === s.source.bucketName;
      });
      const disPrefixes = disallowedPrefixes(bucketName, streams);
      const schema = Joi.object({
        type: Joi.string().valid('replication', 'expiration', 'transition'),
        replication: Joi.when('type', {
          is: Joi.equal('replication'),
          then: Joi.object(
            replicationSchema(
              unallowedBucketName,
              disPrefixes,
              prefixMandatory,
              isTransientLocation(bucketList, locations, bucketName),
            ),
          ),
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
      if (['replication', 'transition'].includes(values.type)) {
        const validation = await joiValidator(values, context, options);
        return validation;
      } else {
        const expiration = prepareExpirationQuery(values.expiration);
        return joiValidator({ ...values, expiration }, context, options);
      }
    },
    defaultValues: defaultFormValues,
  });

  const { handleSubmit, control, watch, formState } = useFormMethods;
  const type = watch('type');
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
          notFalsyTypeGuard(accountId),
          notFalsyTypeGuard(instanceId),
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(mgnt),
            notFalsyTypeGuard(accountId),
            notFalsyTypeGuard(instanceId),
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
          notFalsyTypeGuard(accountId),
          notFalsyTypeGuard(instanceId),
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(mgnt),
            notFalsyTypeGuard(accountId),
            notFalsyTypeGuard(instanceId),
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
          notFalsyTypeGuard(accountId),
          notFalsyTypeGuard(instanceId),
          rolePathName,
        )
        .finally(() => dispatch(networkEnd()));
    },
    {
      onSuccess: (success) => {
        queryClient.invalidateQueries(
          workflowListQuery(
            notFalsyTypeGuard(mgnt),
            notFalsyTypeGuard(accountId),
            notFalsyTypeGuard(instanceId),
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
    <FormProvider {...useFormMethods}>
      <Form
        layout={{ kind: 'page', title: 'Create New Workflow' }}
        onSubmit={handleSubmit(onSubmit)}
        rightActions={
          <Stack gap="r16">
            <Button
              disabled={loading}
              id="cancel-workflow-btn"
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
          </Stack>
        }
      >
        <FormSection
          title={{ name: 'General' }}
          forceLabelWidth={convertRemToPixels(12)}
          style={{ width: '50rem' }}
        >
          <FormGroup
            required
            style={{ width: '50rem' }}
            direction="horizontal"
            id="type"
            label="Rule Type"
            content={
              <Controller
                control={control}
                name="type"
                render={({ field: { onChange, onBlur, value: type } }) => (
                  <Select
                    id="type"
                    onBlur={onBlur}
                    value={type}
                    onChange={(value) => onChange(value)}
                  >
                    <Select.Option
                      value="replication"
                      icon={<OptionIcon icon="Replication" />}
                    >
                      Replication
                    </Select.Option>
                    <Select.Option
                      value="expiration"
                      icon={<OptionIcon icon="Expiration" />}
                    >
                      Expiration
                    </Select.Option>
                    <Select.Option
                      value="transition"
                      icon={<OptionIcon icon="Transition" />}
                    >
                      Transition
                    </Select.Option>
                  </Select>
                )}
              />
            }
          />
          {type === 'replication' && (
            <GeneralReplicationGroup prefix="replication." />
          )}
          {type === 'expiration' && (
            <GeneralExpirationGroup prefix="expiration." />
          )}
          {type === 'transition' && (
            <GeneralTransitionGroup prefix="transition." />
          )}
        </FormSection>
        {type === 'replication' && (
          <ReplicationForm
            bucketList={bucketList}
            locations={locations}
            prefix="replication."
            isCreateMode={true}
          />
        )}
        {type === 'expiration' && (
          <ExpirationForm
            bucketList={bucketList}
            locations={locations}
            prefix="expiration."
          />
        )}
        {type === 'transition' && (
          <TransitionForm
            bucketList={bucketList}
            locations={locations}
            prefix="transition."
          />
        )}
      </Form>
    </FormProvider>
  );
};

export default CreateWorkflow;
