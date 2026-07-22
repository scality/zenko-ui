import { Form, Icon, Stack, Text } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button } from '@scality/core-ui/dist/next';
import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'styled-components';
import Table, * as T from '../../../../ui-elements/Table';
import { ErrorText, StatusBox } from '../../../../ui-elements/status';
import type { StartSetupBody } from '../../api/types';
import { useCRRConfigurationSetupMutation } from '../../hooks/useCRRConfigurationSetupMutation';
import { type ConfigureFormValues, toStartSetupBody } from '../ConfigureStep/schema';
import { allSucceeded, buildStepViews, type StepView } from './steps';

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
  const setup = useCRRConfigurationSetupMutation();

  const {
    accountNameType,
    accountName,
    sourceBucketName,
    destinationAccountName,
    createReplicationRule,
    destinationInstanceName,
  } = props;

  const body: StartSetupBody | null = useMemo(
    () => (isCompleteFormValues(props) ? toStartSetupBody(props) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const globalErrorMessage = setup.isError ? setup.error?.message ?? 'The replication setup could not be completed.' : undefined;

  const stepViews = useMemo(
    () =>
      buildStepViews(
        {
          isNewSourceAccount: accountNameType === 'create',
          createReplicationRule: createReplicationRule === true,
          sourceAccountName: accountName ?? '',
          sourceBucketName: sourceBucketName ?? '',
          targetBucketName: props.targetBucketName ?? '',
          destinationAccountName: destinationAccountName ?? '',
        },
        setup.events,
        { globalErrorMessage },
      ),
    [accountNameType, createReplicationRule, accountName, sourceBucketName, props.targetBucketName, destinationAccountName, setup.events, globalErrorMessage],
  );

  const hasStartedRef = useRef(false);
  const startMutation = setup.mutate;
  useEffect(() => {
    if (body && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startMutation(body);
    }
  }, [body, startMutation]);

  const allDone = allSucceeded(stepViews);

  const advancedRef = useRef(false);
  const setupData = setup.data;
  useEffect(() => {
    if (setupData && !advancedRef.current) {
      advancedRef.current = true;
      next({ result: setupData, ...props });
    }
  }, [setupData, next, props]);

  const onRetry = () => {
    if (!body) return;
    setup.reset();
    advancedRef.current = false;
    hasStartedRef.current = true;
    setup.mutate(body);
  };

  const onContinue = () => {
    if (advancedRef.current || !setupData) return;
    advancedRef.current = true;
    next({ result: setupData, ...props });
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
          <Button
            type="button"
            variant="outline"
            label="Exit"
            disabled={setup.isLoading}
            onClick={() => prev(props)}
          />
          {setup.isLoading && (
            <Button type="button" variant="outline" label="Cancel" onClick={setup.cancel} />
          )}
          <Button
            type="button"
            variant="primary"
            label="Continue"
            icon={<Icon name="Arrow-right" />}
            isLoading={setup.isLoading}
            disabled={!allDone || !setup.data}
            onClick={onContinue}
          />
        </Stack>
      }
      style={{ width: '50rem' }}
    >
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
                  <StatusCell view={view} onRetry={onRetry} />
                </T.Cell>
              </T.Row>
            ))}
          </T.Body>
        </Table>
      </div>
    </Form>
  );
};
