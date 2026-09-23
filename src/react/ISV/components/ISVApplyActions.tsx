import { Banner, ConstrainedText, Icon, Stack } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Form } from '../../ui-elements/CoreUIForm';
import Table, * as T from '../../ui-elements/Table';
import { StatusBox } from '../../ui-elements/status';
import { Button } from '@scality/core-ui/dist/next';
import { type CSSProperties, useCallback, memo, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useTheme } from 'styled-components';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ISVStepsIndexes, ISV_STEPS } from './ISVSteps';
import { ISVSkipModal } from './ISVSkipModal';
import { Account } from '../../next-architecture/domain/entities/account';
import { useChainedMutations } from '@scality/react-chained-query';
import type { StepStatus } from '@scality/react-chained-query';
import { useCheckSOSAPIStatus } from '../hooks/useCheckSOSAPIStatus';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import { useMutationExecutor, buildRuntimeContext } from '../hooks/useMutationExecutor';
import { ISVPlatform, FormData, BucketItem, OptionalFailure } from '../engine/types';
import { useGetS3ServicePoint } from '../hooks/useGetS3ServicePoint';
import { useAutoScrollOnce } from '../hooks/useAutoScrollOnce';

type ISVApplyActionsProps = FormData & {
  platform: ISVPlatform;
  account: Account | null;
  accessKey?: string;
  secretKey?: string;
  accessKeys?: string[];
};

// ============================================================================
// Status Display Component
// ============================================================================

// The rows below are flex rows, so a cell's width is its flex basis. Step is the only column
// with bounded content -- a step number -- so it is the only one pinned; Status may shrink below
// its basis, wrapping the Retry button under the label, and the action sentence takes the rest
// and ellipsises. Nothing carries a minimum, because any floor here is paid for in overflow: an
// 8rem floor on the action column put 45px back at a 768px content box.
const STEP_COLUMN: CSSProperties = { boxSizing: 'border-box', flex: '0 0 3.5rem' };
const ACTION_COLUMN: CSSProperties = { boxSizing: 'border-box', flex: '1 1 0', minWidth: 0 };
const STATUS_COLUMN: CSSProperties = { boxSizing: 'border-box', flex: '0 1 9rem', minWidth: 0 };

const ChainStatusDisplay = memo(function ChainStatusDisplay({
  props,
  steps,
  allRequiredStepsComplete,
  hasOptionalFailures,
  optionalFailures,
  hasError,
  getResult,
}: {
  props: ISVApplyActionsProps;
  steps: StepStatus[];
  allRequiredStepsComplete: boolean;
  hasOptionalFailures: boolean;
  optionalFailures: OptionalFailure[];
  hasError: boolean;
  getResult: <T = unknown>(id: string) => T | undefined;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const scrollContainerRef = useAutoScrollOnce();
  const theme = useTheme();
  const navigate = useBasenameRelativeNavigate();
  const queryClient = useQueryClient();
  const { next } = useStepper(ISVStepsIndexes.ApplyActions, ISV_STEPS);

  const { platform, accessKey } = props;

  const continueLabel =
    hasOptionalFailures && platform.continueWithOptionalFailuresLabel
      ? platform.continueWithOptionalFailuresLabel
      : 'Continue';

  const accessKeyData = getResult<{
    AccessKey: { AccessKeyId: string; SecretAccessKey: string };
  }>('createAccessKey');
  const finalAccessKey = accessKey || accessKeyData?.AccessKey?.AccessKeyId || '';
  const finalSecretKey = accessKeyData?.AccessKey?.SecretAccessKey || '';

  const handleContinue = useCallback(() => {
    queryClient.invalidateQueries(['WebIdentityRoles']);
    next({
      ...props,
      accessKey: finalAccessKey,
      secretKey: finalSecretKey,
      optionalFailures: hasOptionalFailures ? optionalFailures : undefined,
    });
  }, [props, finalAccessKey, finalSecretKey, queryClient, next, hasOptionalFailures, optionalFailures]);

  const handleExit = useCallback(() => {
    setConfirmCancel(true);
    queryClient.invalidateQueries(['WebIdentityRoles']);
  }, [queryClient]);

  return (
    <>
      <ISVSkipModal
        isOpen={confirmCancel}
        close={() => setConfirmCancel(false)}
        exitAction={() => navigate('/')}
        title={`Exit ${platform.name} Assistant Configuration`}
        modalContent={<>{platform.skipModalContent}</>}
      />
      <Form
        layout={{
          title: `Configure ARTESCA for ${platform.name}`,
          kind: 'page',
        }}
        requireMode="all"
        rightActions={
          <Stack gap="r16">
            <Button type="button" disabled={!hasError} variant="outline" label="Exit" onClick={handleExit} />
            <Button
              disabled={!allRequiredStepsComplete}
              variant="primary"
              type="button"
              label={continueLabel}
              icon={<Icon name="Arrow-right" />}
              onClick={handleContinue}
            />
          </Stack>
        }
        style={{ maxWidth: '50rem', width: '100%' }}
        responsive
      >
        <Stack gap="r16" direction="vertical">
          <div ref={scrollContainerRef} style={{ height: '32rem', overflow: 'auto' }}>
            <Table>
              <T.Head>
                <T.HeadRow style={{ display: 'flex' }}>
                  <T.HeadCell style={STEP_COLUMN}>Step</T.HeadCell>
                  <T.HeadCell style={ACTION_COLUMN}>Action</T.HeadCell>
                  <T.HeadCell style={STATUS_COLUMN}>Status</T.HeadCell>
                </T.HeadRow>
              </T.Head>
              <T.Body>
                {steps.map((row) => (
                  <T.Row key={row.id} style={{ display: 'flex' }}>
                    <T.Cell style={STEP_COLUMN}>{row.step}</T.Cell>
                    <T.Cell style={ACTION_COLUMN}>
                      <ConstrainedText text={row.label} />
                    </T.Cell>
                    <T.Cell style={STATUS_COLUMN}>
                      {row.status === 'success' ? (
                        <StatusBox>
                          <Icon name="Check" color={theme.statusHealthy} />
                          <span>Success</span>
                        </StatusBox>
                      ) : row.status === 'error' ? (
                        <StatusBox>
                          <Icon name="Exclamation-circle" color={theme.statusCritical} />
                          <span>Failed</span>
                          <Button
                            icon={<Icon name="Redo" />}
                            variant="secondary"
                            type="button"
                            label="Retry"
                            onClick={row.retry}
                          />
                        </StatusBox>
                      ) : (
                        <span>Pending...</span>
                      )}
                    </T.Cell>
                  </T.Row>
                ))}
              </T.Body>
            </Table>
          </div>
          {hasOptionalFailures && allRequiredStepsComplete && (
            <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
              {platform.defaultOptionalFailureMessage ||
                'Some optional configuration steps were unsuccessful. You may continue with manual configuration.'}
            </Banner>
          )}
        </Stack>
      </Form>
    </>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export default memo(function ISVApplyActions(props: ISVApplyActionsProps) {
  const {
    buckets = [],
    enableImmutableBackup,
    accountName,
    platform,
    IAMUserNameType,
    IAMUserName,
    account,
    generateKey,
    application,
    accessKey,
    secretKey,
    accessKeys,
    ...restFormData
  } = props;

  const sosApiStatus = useCheckSOSAPIStatus();
  const instanceId = useInstanceId();
  const { s3ServicePoint } = useGetS3ServicePoint();

  // Build form data for mutation executor
  const formData: FormData = {
    accountName,
    accountNameType: account ? 'existing' : 'create',
    IAMUserName,
    IAMUserNameType,
    generateKey,
    application,
    enableImmutableBackup,
    buckets: buckets as BucketItem[],
    ...restFormData,
  };

  // Build runtime context
  const context = buildRuntimeContext({
    platform,
    account: account
      ? {
          id: account.id,
          name: account.name,
          roleArn: account.preferredAssumableRoleArn,
        }
      : null,
    IAMUserNameType,
    generateKey,
    sosApiStatus,
    instanceId,
    s3ServicePoint,
  });

  // Use the mutation executor to get mutations and variable resolvers
  const { mutations, variables, failureMessages } = useMutationExecutor({
    platform,
    formData,
    context,
  });

  const {
    Slots,
    steps,
    hasError,
    getResult,
    allRequiredStepsComplete,
    hasOptionalFailures,
    optionalFailures: libraryOptionalFailures,
  } = useChainedMutations({
    mutations,
    variables,
  });

  // Build OptionalFailure[] with resolved failure messages from platform config
  const optionalFailures: OptionalFailure[] = useMemo(
    () =>
      libraryOptionalFailures.map((f) => ({
        id: f.id,
        label: f.label,
        message:
          failureMessages[f.id] || platform.defaultOptionalFailureMessage || 'This optional step was unsuccessful.',
      })),
    [libraryOptionalFailures, failureMessages, platform.defaultOptionalFailureMessage],
  );

  return (
    <>
      {Slots}
      <ChainStatusDisplay
        props={props}
        steps={steps}
        allRequiredStepsComplete={allRequiredStepsComplete}
        hasOptionalFailures={hasOptionalFailures}
        optionalFailures={optionalFailures}
        hasError={hasError}
        getResult={getResult}
      />
    </>
  );
});
