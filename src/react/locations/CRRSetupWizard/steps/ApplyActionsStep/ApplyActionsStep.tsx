import { Form, Icon, Stack, Text } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button } from '@scality/core-ui/dist/next';
import { useCreateBucket, useSetBucketReplication, useSetBucketVersioning } from '@scality/data-browser-library';
import {
  type MutationConfig,
  type PreviousResults,
  useChainedMutations,
  type VariablesResolvers,
} from '@scality/react-chained-query';
import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'styled-components';
import { useCreateAccountMutation } from '../../../../../js/mutations';
import { useListAccounts } from '../../../../next-architecture/domain/business/accounts';
import { useAccessibleAccountsAdapter } from '../../../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { useInstanceId } from '../../../../next-architecture/ui/AuthProvider';
import { NoOpMetricsAdapter } from '../../../../ui-elements/SelectAccountIAMRole';
import { ErrorText, StatusBox } from '../../../../ui-elements/status';
import Table, * as T from '../../../../ui-elements/Table';
import type { SetupResult, StartSetupBody } from '../../api/types';
import { sourceStorageManagerRoleArn, useAssumeSourceRoleMutation } from '../../hooks/useAssumeSourceRoleMutation';
import { useCRRConfigurationSetupMutation } from '../../hooks/useCRRConfigurationSetupMutation';
import { useCreateCRRLocationMutation } from '../../hooks/useCreateCRRLocationMutation';
import { useImportDestinationCertificateMutation } from '../../hooks/useImportDestinationCertificateMutation';
import { type ConfigureFormValues, toStartSetupBody } from '../ConfigureStep/schema';
import { buildCRRLocation, buildCRRLocationName } from './crrLocation';
import { buildCRRReplicationConfiguration } from './replicationConfiguration';
import {
  allSucceeded,
  buildStepViews,
  type ChainStatus,
  CONFIGURATOR_CHAIN_LINK_ID,
  retryLinkIdForRow,
  type StepView,
} from './steps';

export const APPLY_ACTIONS_STEP_INDEX = 1;

type Props = Partial<ConfigureFormValues> & { destinationInstanceName?: string };

const isCompleteFormValues = (values: Props): values is ConfigureFormValues =>
  values.connectionMode !== undefined && values.certificate !== undefined && values.username !== undefined;

const StatusCell = ({ view, onRetry }: { view: StepView; onRetry: () => void }) => {
  const theme = useTheme();
  if (view.state === 'succeeded') {
    return (
      <StatusBox>
        <Icon name="Check" color={theme.statusHealthy} />
        <span>Success</span>
      </StatusBox>
    );
  }
  if (view.state === 'failed') {
    return (
      <StatusBox>
        <Icon name="Exclamation-circle" color={theme.statusCritical} />
        <span>Failed</span>
        <Button icon={<Icon name="Redo" />} variant="secondary" type="button" label="Retry" onClick={onRetry} />
        {view.errorMessage && <ErrorText>{view.errorMessage}</ErrorText>}
      </StatusBox>
    );
  }
  return <span>Pending...</span>;
};

export const ApplyActionsStep = (props: Props) => {
  const { next, prev } = useStepper(APPLY_ACTIONS_STEP_INDEX);
  const instanceId = useInstanceId();

  const {
    accountNameType,
    accountName,
    sourceBucketName,
    destinationAccountName,
    createReplicationRule,
    destinationInstanceName,
  } = props;
  const isNewSourceAccount = accountNameType === 'create';
  const withReplicationRule = createReplicationRule === true;

  // Pre-create every mutation so per-row error messages stay accessible.
  const importCertificate = useImportDestinationCertificateMutation();
  const createSourceAccount = useCreateAccountMutation();
  const assumeSourceRole = useAssumeSourceRoleMutation();
  const createSourceBucket = useCreateBucket();
  const enableSourceVersioning = useSetBucketVersioning();
  const setup = useCRRConfigurationSetupMutation();
  const createLocation = useCreateCRRLocationMutation();
  const createReplicationRuleMutation = useSetBucketReplication();

  const accountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = useMemo(() => new NoOpMetricsAdapter(), []);
  const { accounts: accountsResult } = useListAccounts({ accessibleAccountsAdapter: accountsAdapter, metricsAdapter });
  const existingSourceRoleArn =
    accountsResult.status === 'success'
      ? (accountsResult.value.find((account) => account.name === accountName)?.preferredAssumableRoleArn ?? '')
      : '';

  // biome-ignore lint/correctness/useExhaustiveDependencies: depend on the individual form fields, not the props object identity
  const body: StartSetupBody | null = useMemo(
    () => (isCompleteFormValues(props) ? toStartSetupBody(props) : null),
    [
      props.connectionMode,
      props.certificate,
      props.username,
      props.password,
      props.url,
      props.baseDomain,
      props.s3Endpoint,
      accountNameType,
      accountName,
      destinationAccountName,
      createReplicationRule,
      sourceBucketName,
      props.targetBucketName,
    ],
  );

  const locationName = buildCRRLocationName({
    destinationAccountName: destinationAccountName ?? '',
    url: props.url || undefined,
    baseDomain: props.baseDomain || undefined,
  });

  const sourceRoleArn = (prev: PreviousResults): string => {
    if (isNewSourceAccount) {
      const account = prev['create-source-account']?.data as { id?: string } | undefined;
      return account?.id ? sourceStorageManagerRoleArn(account.id) : '';
    }
    return existingSourceRoleArn;
  };

  const configuratorResult = (prev: PreviousResults) =>
    prev[CONFIGURATOR_CHAIN_LINK_ID]?.data as SetupResult | undefined;

  // biome-ignore lint/correctness/useExhaustiveDependencies: rebuild only when the chain's shape or resolved inputs change, not on every mutation-instance render
  const { mutations, variables } = useMemo(() => {
    const configs: MutationConfig[] = [
      { id: 'import-destination-certificate', label: 'Import Destination Certificate', mutation: importCertificate },
    ];
    const resolvers: VariablesResolvers = {
      'import-destination-certificate': () => ({ certificate: props.certificate }),
    };

    if (isNewSourceAccount) {
      configs.push({ id: 'create-source-account', label: 'Create Source Account', mutation: createSourceAccount });
      resolvers['create-source-account'] = () => ({
        user: { userName: accountName ?? '', email: `${accountName}@artesca.local` },
        instanceId,
      });
    }

    if (withReplicationRule) {
      configs.push({ id: 'assume-source-role', label: 'Assume Source Role', mutation: assumeSourceRole });
      resolvers['assume-source-role'] = (prev) => ({ roleArn: sourceRoleArn(prev) });

      configs.push({ id: 'create-source-bucket', label: 'Create Source Bucket', mutation: createSourceBucket });
      resolvers['create-source-bucket'] = () => ({ Bucket: sourceBucketName });

      configs.push({
        id: 'create-source-bucket-versioning',
        label: 'Enable Source Versioning',
        mutation: enableSourceVersioning,
      });
      resolvers['create-source-bucket-versioning'] = () => ({
        Bucket: sourceBucketName,
        VersioningConfiguration: { Status: 'Enabled' },
      });
    }

    configs.push({ id: CONFIGURATOR_CHAIN_LINK_ID, label: 'Configure Destination', mutation: setup });
    resolvers[CONFIGURATOR_CHAIN_LINK_ID] = () => body;

    configs.push({ id: 'create-location', label: 'Create Location', mutation: createLocation });
    resolvers['create-location'] = (prev) => {
      const result = configuratorResult(prev);
      if (!result) throw new Error('Cannot create the CRR location: the destination setup result is missing.');
      return buildCRRLocation(locationName, result);
    };

    if (withReplicationRule) {
      configs.push({
        id: 'create-replication-rule',
        label: 'Create Replication Rule',
        mutation: createReplicationRuleMutation,
      });
      resolvers['create-replication-rule'] = (prev) => {
        const result = configuratorResult(prev);
        if (!result) throw new Error('Cannot create the replication rule: the destination setup result is missing.');
        return buildCRRReplicationConfiguration({
          sourceBucketName: sourceBucketName ?? '',
          targetBucketName: props.targetBucketName ?? '',
          locationName,
          destinationRoleArn: result.roleArn,
        });
      };
    }

    return { mutations: configs, variables: resolvers };
  }, [isNewSourceAccount, withReplicationRule, body, locationName, existingSourceRoleArn]);

  const { Slots, steps, start, getResult, allRequiredStepsComplete } = useChainedMutations({ mutations, variables });

  const errorMessage = (error: unknown): string | undefined => (error as Error | undefined)?.message;
  const linkErrors: Record<string, string | undefined> = {
    'import-destination-certificate': errorMessage(importCertificate.error),
    'create-source-account': errorMessage(createSourceAccount.error),
    'assume-source-role': errorMessage(assumeSourceRole.error),
    'create-source-bucket': errorMessage(createSourceBucket.error),
    'create-source-bucket-versioning': errorMessage(enableSourceVersioning.error),
    'create-location': errorMessage(createLocation.error),
    'create-replication-rule': errorMessage(createReplicationRuleMutation.error),
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-read the current link errors whenever the chain steps change
  const chainStatusById: Record<string, ChainStatus> = useMemo(() => {
    const byId: Record<string, ChainStatus> = {};
    for (const step of steps) {
      byId[step.id] = { status: step.status, errorMessage: linkErrors[step.id] };
    }
    return byId;
  }, [steps]);

  const configuratorStatus = steps.find((step) => step.id === CONFIGURATOR_CHAIN_LINK_ID)?.status;
  const configuratorError =
    configuratorStatus === 'error'
      ? ((setup.error as Error | undefined)?.message ?? 'The destination setup failed.')
      : undefined;

  const stepViews = useMemo(
    () =>
      buildStepViews(
        {
          isNewSourceAccount,
          createReplicationRule: withReplicationRule,
          sourceAccountName: accountName ?? '',
          sourceBucketName: sourceBucketName ?? '',
          targetBucketName: props.targetBucketName ?? '',
          destinationAccountName: destinationAccountName ?? '',
        },
        { configuratorEvents: setup.events, chainStatusById, configuratorError },
      ),
    [
      isNewSourceAccount,
      withReplicationRule,
      accountName,
      sourceBucketName,
      props.targetBucketName,
      destinationAccountName,
      setup.events,
      chainStatusById,
      configuratorError,
    ],
  );

  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (body && !hasStartedRef.current) {
      hasStartedRef.current = true;
      start();
    }
  }, [body, start]);

  const allDone = allSucceeded(stepViews) && allRequiredStepsComplete;
  // While the chain runs, Exit is disabled so the user can't navigate away mid-provisioning; it re-enables on completion or failure.
  const isRunning = steps.some((step) => step.status === 'pending');
  const setupResult = getResult<SetupResult>(CONFIGURATOR_CHAIN_LINK_ID);

  const advancedRef = useRef(false);
  useEffect(() => {
    if (allDone && !advancedRef.current) {
      advancedRef.current = true;
      next({ result: setupResult, ...props });
    }
  }, [allDone, setupResult, next, props]);

  const onRetry = (view: StepView) => {
    const linkId = retryLinkIdForRow(view.id, chainStatusById);
    steps.find((step) => step.id === linkId)?.retry();
  };

  const onContinue = () => {
    if (advancedRef.current || !allDone) return;
    advancedRef.current = true;
    next({ result: setupResult, ...props });
  };

  const title = `Configure ${destinationInstanceName || 'ARTESCA'} for Cross-Region Replication`;

  if (!body) {
    return (
      <Form layout={{ title, kind: 'page' }} style={{ width: '50rem' }}>
        <Text>Please complete the previous step before running the setup.</Text>
      </Form>
    );
  }

  return (
    <Form
      layout={{ title, kind: 'page' }}
      requireMode="all"
      rightActions={
        <Stack gap="r16">
          <Button type="button" variant="outline" label="Exit" disabled={isRunning} onClick={() => prev(props)} />
          {setup.isLoading && <Button type="button" variant="outline" label="Cancel" onClick={setup.cancel} />}
          <Button
            type="button"
            variant="primary"
            label="Continue"
            icon={<Icon name="Arrow-right" />}
            isLoading={setup.isLoading}
            disabled={!allDone}
            onClick={onContinue}
          />
        </Stack>
      }
      style={{ width: '50rem' }}
    >
      {Slots}
      <div style={{ height: '32rem', overflow: 'auto' }}>
        <Table>
          <T.Head>
            <T.HeadRow style={{ display: 'flex' }}>
              <T.HeadCell style={{ width: '150px' }}>Step</T.HeadCell>
              <T.HeadCell style={{ width: '50%' }}>Action</T.HeadCell>
              <T.HeadCell style={{ width: '12.5%' }}>Status</T.HeadCell>
            </T.HeadRow>
          </T.Head>
          <T.Body>
            {stepViews.map((view) => (
              <T.Row key={view.id} style={{ display: 'flex' }}>
                <T.Cell style={{ width: '150px' }}>{view.step}</T.Cell>
                <T.Cell style={{ width: '50%' }}>
                  <Text>{view.label}</Text>
                </T.Cell>
                <T.Cell style={{ width: '12.5%' }}>
                  <StatusCell view={view} onRetry={() => onRetry(view)} />
                </T.Cell>
              </T.Row>
            ))}
          </T.Body>
        </Table>
      </div>
    </Form>
  );
};
